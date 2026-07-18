# Foodiq Kubernetes manifests

Apply dry-run (no cluster required for validation of YAML shape when kubectl is installed):

```bash
kubectl apply --dry-run=client -f deploy/k8s/foodiq.yaml
```

Includes Namespace, ConfigMap, API Deployment/Service, HPA, PDB, Ingress, Redis.

Secrets (`foodiq-api-secrets`) are optional in the manifest — create before production apply.

## Multi-region (4.0 docs)

See [`docs/V4_MULTI_REGION.md`](../../docs/V4_MULTI_REGION.md) for active-passive
targets and failover drills. Set `FOOIQ_REGION` per cluster.
