import { Component, type ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface ChartErrorBoundaryProps {
  children: ReactNode
}

interface ChartErrorBoundaryState {
  hasError: boolean
}

// React only supports error boundaries as class components (exception to FE-02).
// If a lazy chart chunk fails to load, only that chart shows an error instead of the whole dashboard unmounting.
export class ChartErrorBoundary extends Component<ChartErrorBoundaryProps, ChartErrorBoundaryState> {
  state: ChartErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ChartErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-border/60">
          <CardContent>
            <div role="alert" className="flex h-[280px] items-center justify-center text-muted-foreground text-sm">
              Could not load the chart.
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
