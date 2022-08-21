---
to: src/components/<%=name%>/index.tsx
---
import { observer } from 'mobx-react-lite'
import './styles.module.css'

// interface Props {}

const <%=Name%> = observer(() => {
  return (
    <div styleName="wrapper">
      Hello, world!
    </div>
  )
})

export default <%=Name%>


