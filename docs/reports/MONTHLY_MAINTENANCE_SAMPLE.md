# Sample Monthly Maintenance Report (template)

Generated via `GET /api/admin/maintenance/report?period=monthly`.

```json
{
  "period_label": "monthly",
  "period": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" },
  "health": { "database": "up" },
  "reviews": { "count": 0, "avg_rating": 0 },
  "delivery_reviews": { "count": 0, "avg_rating": 0 },
  "bugs": { "opened": 0, "resolved": 0, "open_now": 0 },
  "errors": { "count": 0, "server_errors": 0 },
  "orders": { "total": 0, "delivered": 0, "gmv": 0 },
  "feedback": {
    "product": 0,
    "support": 0,
    "contact": 0,
    "order_feedback": 0
  }
}
```

Use `/admin/maintenance` to generate a live snapshot after deploy.
