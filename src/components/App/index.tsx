import clsx from 'clsx'
import orderBy from 'lodash-es/orderBy'
import { observer } from 'mobx-react-lite'
import { memo, useEffect, useState } from 'react'
import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import PlusIcon from '../../assets/icons/solid/plus.svg'
import XmarkIcon from '../../assets/icons/solid/xmark.svg'
import './styles.module.css'

function App() {
  const [windowId, setWindowId] = useState<number>(
    chrome.windows?.WINDOW_ID_CURRENT,
  )
  const [tabs, setT] = useState<chrome.tabs.Tab[]>([])
  const [levels, setLevels] = useState<Record<number, number>>({})
  const [x, setX] = useState(0)

  const tabParentMap = React.useRef<Record<number, number | undefined>>({})

  useEffect(() => {
    setX(x + 1)
    chrome.windows.getLastFocused().then((w) => {
      console.log('Set window id', w.id)
      setWindowId(w.id as number)
    })

    const reloadTabs = () => {
      chrome.tabs.query({ windowId }, (tabs) => {
        for (const tab of tabs) {
          if (!tab.id) continue
          if (tab.id in tabParentMap.current) {
            console.log(`Tab ${tab.id} is found in map`)
            tab.openerTabId = tabParentMap.current[tab.id]
          } else {
            console.log(`Tab ${tab.id} is NOT found in map`)
            tabParentMap.current[tab.id] = tab.openerTabId
          }
        }

        console.log(tabParentMap.current)

        const arr: chrome.tabs.Tab[] = []
        const tmpLevels: Record<number, number> = {}
        const mapTabs = (t: chrome.tabs.Tab[], level: number) => {
          for (const tab of t) {
            arr.push(tab)
            tmpLevels[tab.id as number] = level
            const children = tabs.filter((t) => t.openerTabId === tab.id)
            mapTabs(children, level + 1)
          }
        }
        const top = tabs.filter((t) => !t.openerTabId)
        mapTabs(top, 0)
        setT(arr)
        setLevels(tmpLevels)
      })
    }

    const onRemove = (tabId: number) => {
      const newParentId = tabParentMap.current[tabId] ?? undefined
      const children = Object.keys(tabParentMap.current).filter(
        (id) => tabParentMap.current[+id] === tabId,
      )
      for (const child of children) {
        tabParentMap.current[+child] = newParentId
      }
      reloadTabs()
    }

    reloadTabs()
    chrome.tabs.onUpdated.addListener(reloadTabs)
    chrome.tabs.onRemoved.addListener(onRemove)
    chrome.tabs.onMoved.addListener(reloadTabs)
    chrome.tabs.onActivated.addListener(reloadTabs)

    return () => {
      chrome.tabs.onUpdated.removeListener(reloadTabs)
      chrome.tabs.onRemoved.removeListener(reloadTabs)
      chrome.tabs.onMoved.removeListener(reloadTabs)
      chrome.tabs.onActivated.removeListener(reloadTabs)
    }
  }, [windowId])

  const onClick = (tab: chrome.tabs.Tab) => {
    chrome.tabs.update(tab.id as number, { active: true })
  }

  const onCloseClick = (e: React.MouseEvent, tab: chrome.tabs.Tab) => {
    e.preventDefault()
    const activeTab = tabs.find((t) => t.active === true)
    chrome.tabs.remove(tab.id as number, () => {
      if (tab.active) return
      chrome.tabs.update(activeTab?.id as number, { active: true })
    })
  }

  const onOpenNewClick = () => {
    chrome.tabs.create({
      active: true,
      url: 'chrome://vivaldi-webui/startpage',
    })
  }

  return (
    <BrowserRouter>
      <div styleName="app">
        <div styleName="content">
          <div styleName="tabs">
            {tabs.map((tab) => (
              <TabElement
                tab={tab}
                tabs={tabs}
                level={levels[tab.id as number]}
                key={tab.id}
              />
            ))}
            <div styleName="tab transparent" onClick={onOpenNewClick}>
              <span styleName="add">
                <PlusIcon />
              </span>
              <span>Open a New Tab</span>
            </div>
          </div>
        </div>
      </div>
    </BrowserRouter>
  )
}

const TabElement = observer(
  ({
    tab,
    tabs,
    level,
  }: {
    tab: chrome.tabs.Tab
    tabs: chrome.tabs.Tab[]
    level: number
  }) => {
    const onClick = (tab: chrome.tabs.Tab) => {
      chrome.tabs.update(tab.id as number, { active: true })
    }

    const onCloseClick = (e: React.MouseEvent, tab: chrome.tabs.Tab) => {
      e.preventDefault()
      const activeTab = tabs.find((t) => t.active === true)
      chrome.tabs.remove(tab.id as number, () => {
        if (tab.active) return
        chrome.tabs.update(activeTab?.id as number, { active: true })
      })
    }

    let title = tab.title as string

    if (tab.url) {
      const url = new URL(tab.url as string)
      if (url.host === 'vivaldi-webui') {
        if (url.pathname === '/startpage') {
          if (url.searchParams.get('section') === 'history')
            title = 'Vivaldi: History'
          if (url.searchParams.get('section') === 'Speed-dials')
            title = 'Vivaldi: New tab '
        }
      }
    }

    return (
      <div
        key={tab.id}
        styleName={clsx('tab', tab.active && 'active')}
        onClick={() => onClick(tab)}
        style={{
          marginLeft: tab.openerTabId ? level * 12 + 'px' : 0,
        }}
        title={title}
      >
        <img src={tab.favIconUrl} />
        <span>{title}</span>
        <div styleName="close" onClick={(e) => onCloseClick(e, tab)}>
          <XmarkIcon />
        </div>
      </div>
    )
  },
)

export default memo(App)
