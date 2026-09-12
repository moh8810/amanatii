import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/merchant/amanat/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/merchant/amanat/new"!</div>
}
