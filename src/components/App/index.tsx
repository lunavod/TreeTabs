import clsx from 'clsx'
import { observer } from 'mobx-react-lite'
import { memo, useEffect, useRef, useState } from 'react'
import React from 'react'
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import FileQuestionIcon from '../../assets/icons/solid/file-circle-question.svg'
import PlusIcon from '../../assets/icons/solid/plus.svg'
import VolumeHighIcon from '../../assets/icons/solid/volume-high.svg'
import VolumeLowIcon from '../../assets/icons/solid/volume-low.svg'
// import VolumeIcon from '../../assets/icons/solid/volume.svg'
import XmarkIcon from '../../assets/icons/solid/xmark.svg'
import styles from './styles.module.css'

type VivaldiTab = chrome.tabs.Tab & { vivExtData?: string }

function App() {
  const [windowId, setWindowId] = useState<number>(
    chrome.windows?.WINDOW_ID_CURRENT,
  )
  const [tabs, setT] = useState<VivaldiTab[]>([])
  const [levels, setLevels] = useState<Record<number, number>>({})
  const [x, setX] = useState(0)
  const [pos, setPos] = useState<Record<string, string>>({})
  const [contextTab, setContextTab] = useState<VivaldiTab | null>(null)

  const tabParentMap = React.useRef<Record<number, number | undefined>>({})

  useEffect(() => {
    if (!chrome.windows) return
    setX(x + 1)
    chrome.windows.getLastFocused().then((w) => {
      setWindowId(w.id as number)
    })

    const reloadTabs = () => {
      chrome.tabs.query({ windowId }, (tabs) => {
        for (const tab of tabs) {
          if (!tab.id) continue
          if (tab.id in tabParentMap.current) {
            tab.openerTabId = tabParentMap.current[tab.id]
          } else {
            tabParentMap.current[tab.id] = tab.openerTabId
          }
        }

        const arr: VivaldiTab[] = []
        const tmpLevels: Record<number, number> = {}
        const mapTabs = (t: VivaldiTab[], level: number) => {
          for (const tab of t) {
            arr.push(tab)
            tmpLevels[tab.id as number] = level
            const children = tabs.filter((t) => t.openerTabId === tab.id)
            mapTabs(children as VivaldiTab[], level + 1)
          }
        }
        const top = tabs.filter((t) => !t.openerTabId)
        mapTabs(top as VivaldiTab[], 0)
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

    const onClick = () => {
      setPos({})
      setContextTab(null)
    }

    document.addEventListener('click', onClick)

    return () => {
      chrome.tabs.onUpdated.removeListener(reloadTabs)
      chrome.tabs.onRemoved.removeListener(onRemove)
      chrome.tabs.onMoved.removeListener(reloadTabs)
      chrome.tabs.onActivated.removeListener(reloadTabs)
      document.removeEventListener('click', onClick)
    }
  }, [windowId])

  const onOpenNewClick = () => {
    chrome.tabs.create({
      active: true,
      url: 'chrome://vivaldi-webui/startpage',
    })
  }

  const onContextMenu = (
    e: React.MouseEvent<Element, MouseEvent>,
    tab: VivaldiTab,
  ) => {
    e.preventDefault()

    const _pos: Record<string, string> = {}
    if (e.pageX < window.innerWidth / 2) _pos.left = `${e.pageX}px`
    else _pos.right = `${window.innerWidth - e.pageX}px`
    if (e.pageY < (window.innerHeight / 4) * 3) _pos.top = `${e.pageY}px`
    else _pos.bottom = `${window.innerHeight - e.pageY}px`

    setPos(_pos)
    setContextTab(tab)
  }

  const onCloseWithChildren = (e: React.MouseEvent, tab: VivaldiTab) => {
    e.preventDefault()
    const tabsMap = tabParentMap.current
    const tmp = [tab]
    let newActiveTab: number
    if (tab.active && tabs.findIndex((t) => t.id === tab.id) > 0)
      newActiveTab = tabs[tabs.findIndex((t) => t.id === tab.id) - 1]
        .id as number
    const rec = (parentId: number) => {
      tabs
        .filter((t) => tabsMap[t.id as number] === parentId)
        .forEach((t) => {
          tmp.push(t)
          rec(t.id as number)
        })
    }
    rec(tab.id as number)

    Promise.all(tmp.map((t) => chrome.tabs.remove(t.id as number))).then(() => {
      if (newActiveTab)
        chrome.tabs.update(newActiveTab as number, { active: true })
    })
  }

  const onCloseTop = (tab: VivaldiTab) => {
    const activeIndex = tabs.findIndex((t) => !!t.active)
    const index = tabs.findIndex((t) => t.id === tab.id)
    const tmp = tabs.slice(0, index)

    if (activeIndex < index)
      chrome.tabs.update(tabs[index].id as number, { active: true })

    tmp.forEach((t) => chrome.tabs.remove(t.id as number))
  }

  const onCloseBottom = (tab: VivaldiTab) => {
    const activeIndex = tabs.findIndex((t) => !!t.active)
    const index = tabs.findIndex((t) => t.id === tab.id)
    const tmp = tabs.slice(index + 1)

    if (activeIndex > index)
      chrome.tabs.update(tabs[index].id as number, { active: true })

    tmp.forEach((t) => chrome.tabs.remove(t.id as number))
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
                tabsMap={tabParentMap.current}
                level={levels[tab.id as number]}
                key={tab.id}
                onContextMenu={onContextMenu}
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
        {!!(pos.left || pos.right) && (
          <div style={pos} styleName="menu">
            <div
              onClick={(e) => onCloseWithChildren(e, contextTab as VivaldiTab)}
            >
              Закрыть с детьми
            </div>
            <div onClick={() => onCloseBottom(contextTab as VivaldiTab)}>
              Закрыть все ниже
            </div>
            <div onClick={() => onCloseTop(contextTab as VivaldiTab)}>
              Закрыть все выше
            </div>
            <div onClick={() => location.reload()}>Перезагрузить</div>
          </div>
        )}
      </div>
    </BrowserRouter>
  )
}

const TabElement = observer(
  ({
    tab,
    tabs,
    tabsMap,
    level,
    onContextMenu,
  }: {
    tab: VivaldiTab
    tabs: VivaldiTab[]
    tabsMap: Record<number, number | undefined>
    level: number
    onContextMenu: (e: React.MouseEvent, tab: VivaldiTab) => any
  }) => {
    const onClick = (e: React.MouseEvent, tab: VivaldiTab) => {
      const target = e.target as HTMLElement

      let el = target
      while (el.parentElement) {
        if (
          [...el.classList].includes(styles.closeWithChildren) ||
          [...el.classList].includes(styles.close)
        )
          return
        el = el.parentElement
      }

      console.log('ACTIVATING')
      chrome.tabs.update(tab.id as number, { active: true })
    }

    const onCloseClick = (e: React.MouseEvent, tab: VivaldiTab) => {
      e.preventDefault()
      let newActiveTab: number = tabs.find((t) => t.active === true)
        ?.id as number
      if (tab.active && tabs.findIndex((t) => t.id === tab.id) > 0)
        newActiveTab = tabs[tabs.findIndex((t) => t.id === tab.id) - 1]
          .id as number

      chrome.tabs.remove(tab.id as number, () => {
        if (tab.active) return
        chrome.tabs.update(newActiveTab, { active: true })
      })
    }

    let title = tab.title as string

    if (tab.url) {
      const url = new URL(tab.url as string)
      if (url.host === 'vivaldi-webui') {
        title = 'Vivaldi: New tab '
        if (url.pathname === '/startpage') {
          if (url.searchParams.get('section') === 'history')
            title = 'Vivaldi: History'
          if (url.searchParams.get('section') === 'Speed-dials')
            title = 'Vivaldi: New tab '
        }
      }
    }

    const getThumbnail = () => {
      const thumb = JSON.parse(
        !!tab.vivExtData ? tab.vivExtData : '{"thumbnail": ""}',
      ).thumbnail
      return thumb
    }

    const timer = useRef<null | number>(null)
    const [popupShown, setPopupShown] = useState(false)

    const onMouseEnter = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setPopupShown(true), 500)
    }
    const onMouseLeave = () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = null
      setPopupShown(false)
    }

    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
      if (!ref.current) return
      ref.current.addEventListener(
        'contextmenu',
        // @ts-ignore
        (e: React.MouseEvent<Element, MouseEvent>) => onContextMenu(e, tab),
      )
    }, [])

    return (
      <div
        styleName="tabWrapper"
        style={
          {
            '--offset': tab.openerTabId ? level * 12 + 'px' : '0px',
          } as React.CSSProperties
        }
      >
        <div
          ref={ref}
          key={tab.id}
          styleName={clsx('tab', tab.active && 'active')}
          onClick={(e) => onClick(e, tab)}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {!!tab.favIconUrl && <img src={tab.favIconUrl} />}
          {!tab.favIconUrl && (
            <div styleName="noFavicon">
              <FileQuestionIcon />
            </div>
          )}
          {!!tab.audible && <VolumeIndicator />}
          <span styleName="title">{title}</span>
          <div styleName="close" onClick={(e) => onCloseClick(e, tab)}>
            <XmarkIcon />
          </div>
        </div>
        <div styleName="popup" style={{ opacity: popupShown ? 1 : 0 }}>
          <span styleName="tabTitle">{title}</span>
          <span styleName="tabUrl">{tab.url}</span>
          <img src={getThumbnail()} styleName="thumbnail" />
        </div>
      </div>
    )
  },
)

export const VolumeIndicator = () => {
  const icons = [VolumeLowIcon, VolumeHighIcon]
  const [i, setI] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setI((i) => (i === 1 ? 0 : i + 1))
    }, 500)
    return () => clearInterval(interval)
  })

  const Icon = icons[i]

  return (
    <div styleName="volume">
      <Icon />
    </div>
  )
}

export default memo(App)
