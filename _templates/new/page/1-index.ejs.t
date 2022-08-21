---
to: src/pages/<%=name%>/index.tsx
---
import { observer } from 'mobx-react-lite'

import { useMobx } from '../useMobx'
import {<%=Name%>Store} from './store'
import './styles.module.css'

// interface Props {}

const <%=Name%> = observer(() => {
  const state = useMobx(new <%=Name%>Store())
  
  return (
    <div styleName="wrapper">
      Hello, world!
    </div>
  )
})

export default <%=Name%>


