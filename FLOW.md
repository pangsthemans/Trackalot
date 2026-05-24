# Frontend ↔ Backend Flow

A walkthrough of how the Angular UI connects to the Play REST API, with a
concrete example for each major interaction.

---

## The proxy: why it exists

Angular dev server runs on `:4200`. Play runs on `:9000`. If Angular called
`http://localhost:9000/parcels` directly, the **browser would block it** —
cross-origin policy says a page on `:4200` cannot make requests to `:9000`.

The proxy in `proxy.conf.json` tells the Angular dev server: intercept any
request whose path starts with `/api` and forward it to `:9000`, stripping
the `/api` prefix first. The browser thinks it's talking to `:4200` the whole
time — it never sees `:9000`.

```
Browser (thinks it's all :4200)
    │
    │  POST /api/parcels
    ▼
Angular dev server (:4200)
    │  strips /api → POST /parcels
    │  forwards to localhost:9000
    ▼
Play REST API (:9000)
```

In production you'd put nginx or a load balancer in front of both and do the
same thing at the infrastructure level.

---

## Full request lifecycle: "Create Parcel"

```
1. User clicks "New Parcel" button
        │
        ▼
2. ParcelList.openCreate()
   calls MatDialog.open(CreateParcelDialog)
   Angular renders the dialog component in an overlay
        │
        ▼
3. User fills the form, clicks "Create"
   CreateParcelDialog.submit()
   Reactive form validates — all 3 fields required
        │ form.valid === true
        ▼
4. ParcelService.create({ senderName, recipientName, recipientAddress })
   HttpClient.post('/api/parcels', body)
        │
        ▼ (proxy intercepts, strips /api)
5. Play receives POST /parcels
   routes file maps it → ParcelController.create
        │
        ▼
6. ParcelController.create
   request.body.validate[CreateParcelRequest]  ← JSON → case class
        │ JsSuccess
        ▼
7. ParcelRepository.create(senderName, recipientName, recipientAddress)
   Anorm executes:
     INSERT INTO parcels (...) VALUES (...) RETURNING *
        │
        ▼
8. Postgres writes the row, returns it
   Anorm maps the row → Parcel case class
        │
        ▼
9. Back in ParcelController:
   MetricsService.incrementParcelCreated()  ← counter +1
   Created(Json.toJson(parcel))             ← 201 with JSON body
        │
        ▼ (response travels back through proxy)
10. HttpClient receives 201 + JSON
    Deserialises into Parcel TypeScript interface
        │
        ▼
11. CreateParcelDialog: dialogRef.close(parcel)
    Dialog closes, returns the created parcel to the caller
        │
        ▼
12. ParcelList.openCreate() afterClosed() callback fires
    calls this.load() → GET /api/parcels → table refreshes
```

---

## How each Angular layer maps to each Play layer

```
Angular                          Play
───────────────────────────────────────────────────────
Component (ParcelList)
  calls ParcelService

ParcelService (HttpClient)  ──── POST /api/parcels
  sends typed request              ↕ proxy
                                 conf/routes
                                   maps URL → controller action

                                 ParcelController
                                   validates JSON body
                                   calls repository

                                 ParcelRepository (Anorm)
                                   raw SQL → Postgres

                                 Parcel case class
                                   Json.toJson → JSON response

ParcelService receives JSON
  typed as Parcel interface

Component updates signal
  parcels.set(data)
  Angular re-renders the table
```

---

## Why signals instead of observables for state

`HttpClient` returns an `Observable` — a stream that emits one value (the
response) then completes. We subscribe to it and immediately write the result
into a `signal`. From that point on, Angular's change detection tracks the
signal — whenever `parcels.set(newValue)` is called, every template expression
reading `parcels()` re-evaluates. No manual `detectChanges()` needed.

---

## The PATCH flow: status update triggers Cassandra + Graphite

When you update a status from the UI, Play doesn't just write to Postgres —
it starts two more chains in parallel:

```
Angular PATCH /api/parcels/1/status
    ▼
ParcelController.updateStatus
    ├── ParcelRepository.updateStatus  → Postgres
    ├── ParcelEventPublisher.publish   → Pub/Sub topic
    │       └── CassandraConsumer (subscriber)
    │               └── INSERT into Cassandra parcel_events
    └── MetricsService.incrementStatusChange → Graphite counter
```

The UI only waits for Play's `200 OK`. The Cassandra write happens
asynchronously in the background — that's why `GET /parcels/:id/events` may
show the new event a second or two after the status update returns.
