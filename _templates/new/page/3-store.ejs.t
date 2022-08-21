---
to: src/pages/<%=name%>/store.ts
---
import { MobxStore, observableStore } from '../useMobx'

@observableStore
export class <%=Name%>Store extends MobxStore {
  async initialize() {
    return
  }
}
