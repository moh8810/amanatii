import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/merchant/shipments/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/merchant/shipments/new"!</div>
}
