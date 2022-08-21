---
to: src/api/<%=name%>/index.ts
---
<%
  pluralName = h.inflection.pluralize(name)
  PluralName = h.inflection.pluralize(Name)
%>
import Api from '..'
import { plainToInstance } from 'class-transformer'

import { <%=Name%> } from './<%=name%>'

export class <%=PluralName%>Api extends Api {
  async find(offset = 0, limit = 100) {
    const req = await this.axios.get<<%=Name%>[]>('/<%=pluralName%>', {
      params: { offset, limit },
    })
    return plainToInstance(<%=Name%>, req.data)
  }

  async findOne(id: string) {
    const req = await this.axios.get<<%=Name%>>(`/<%=pluralName%>/${id}`)
    return plainToInstance(<%=Name%>, req.data)
  }

  async create(data: Partial<<%=Name%>>) {
    const req = await this.axios.post<<%=Name%>>('/<%=pluralName%>', data)
    return plainToInstance(<%=Name%>, req.data)
  }

  async update(id: string, data: Partial<<%=Name%>>) {
    const req = await this.axios.patch<<%=Name%>>(`/<%=pluralName%>/${id}`, data)
    return plainToInstance(<%=Name%>, req.data)
  }
}

const <%=pluralName%>Api = new <%=Name%>sApi()
export default <%=pluralName%>Api
