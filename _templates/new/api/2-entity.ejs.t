---
to: src/api/<%=name%>/<%=name%>.ts
---
import { Type } from 'class-transformer'

export class <%=Name%> {
  id: string

  @Type(() => Date)
  createdAt: Date
}