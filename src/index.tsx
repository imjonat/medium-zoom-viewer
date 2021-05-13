import React, {
  FC,
  HTMLAttributes,
  ReactChild,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import styled from 'styled-components'
import { observer, useLocalStore } from 'mobx-react-lite'
import ReactDOM, { render } from 'react-dom'

const StyledDiv = styled.div`
  cursor: zoom-in;
  width: fit-content;
  .medium-zoom-hidden {
    visibility: hidden;
  }
  .medium-zoom-cloned {
    z-index: 10000;
  }
`

export interface Props extends HTMLAttributes<HTMLDivElement> {
  children?: ReactChild | any
}

export const MediumZoomViewer: FC<Props> = observer(function MediumZoomViewer({
  children,
}: Props) {
  const eleParRef = useRef(null)

  const [open, , finalChildren] = useFullScreenViewer(children, eleParRef)

  return (
    <StyledDiv
      className="medium-zoom-viewer"
      ref={eleParRef}
      onClick={() => open()}
    >
      {finalChildren}
    </StyledDiv>
  )
})

const StyledFullScreenDiv = styled.div<{
  initRect: DOMRect | any
  scale: number
  x: number
  y: number
}>`
  cursor: zoom-out;
  position: fixed;
  background: transparent;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: auto;
  z-index: 1000;
  > .medium-zoom-mask {
    opacity: 0;
    position: fixed;
    background: rgba(0, 0, 0, 0.7);
    z-index: 1000;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    transition: opacity 0.3s;
    will-change: opacity;
    &.active {
      opacity: 1;
    }
  }
  > .medium-zoom {
    z-index: 1001;
    position: absolute;
    left: ${(props) => props.initRect?.left}px;
    top: ${(props) => props.initRect?.top}px;
  }
  > .medium-zoom--opened {
    position: absolute;
    left: ${(props) => props.initRect?.left}px;
    top: ${(props) => props.initRect?.top}px;
    transform: scale(${(props) => props.scale})
      translate3d(${(props) => props.x}px, ${(props) => props.y}px, 0px);
  }
  > .medium-zoom--anim {
    transition: transform 0.3s cubic-bezier(0.2, 0, 0.2, 1) !important;
  }
`

const MediumZoomOverlay = observer(function MediumZoomOverlay({
  children,
  close,
  initRef,
}: any) {
  const state = useLocalStore(() => ({
    initRect: { width: 1, height: 1, left: 0, top: 0 },
    windowWidth: 0,
    windowHeight: 0,
    isAnimationPlaying: false,
    isActive: false,
    get scale() {
      // 默认设置到0.8倍宽度
      return (state.windowWidth / state.initRect.width) * 0.8 || 1
    },
    get x() {
      return (
        (state.windowWidth / 2 -
          state.initRect.left -
          state.initRect.width / 2) /
        state.scale
      )
    },
    get y() {
      let delta = 0
      if (state.scale * state.initRect.height >= state.windowHeight) {
        // height超过window高度补偿
        delta = (state.scale * state.initRect.height - state.windowHeight) / 2
      }
      return (
        (state.windowHeight / 2 -
          state.initRect.top -
          state.initRect.height / 2 +
          delta) /
        state.scale
      )
    },
    update(data: any) {
      Object.assign(state, data)
    },
  }))

  const finalNode = useMemo(() => {
    let className = (children.props.className || '') + ' medium-zoom'
    if (state.isActive) {
      // 激活后立即给最终位置和transition
      className += ' medium-zoom--opened'
    }
    if (state.isAnimationPlaying) {
      // 仅仅给动画进行时给动画样式 否则上下滚动时带transition动画
      className += ' medium-zoom--anim'
    }
    return React.cloneElement(children, {
      className,
      onClick: () => undefined,
      style: { ...children.props.style, cursor: 'zoom-out' },
    })
  }, [state.isActive, state.isAnimationPlaying])

  useEffect(() => {
    // 根据动画播放时长设置状态
    setTimeout(() => state.update({ isActive: true, isAnimationPlaying: true }))
    setTimeout(() => state.update({ isAnimationPlaying: false }), 300)
  }, [])

  useEffect(() => {
    // window宽度调整时设置位置
    if (!initRef?.current) return () => undefined

    state.update({
      initRect: initRef.current.getBoundingClientRect(),
    })

    const handleResize = () => {
      const { innerWidth, innerHeight } = window
      state.update({
        windowWidth: innerWidth,
        windowHeight: innerHeight,
      })
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [initRef])

  useEffect(() => {
    // window滚动时设置位置
    const handleScroll: any = () => {
      state.update({
        initRect: initRef.current.getBoundingClientRect(),
      })
    }
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const finalClose = () => {
    state.update({ isActive: false, isAnimationPlaying: true })
    setTimeout(() => {
      close()
    }, 300)
  }

  return (
    <StyledFullScreenDiv
      x={state.x}
      y={state.y}
      scale={state.scale}
      initRect={state.initRect}
      onClick={finalClose}
    >
      <div className={`medium-zoom-mask${state.isActive ? ' active' : ''}`} />
      {finalNode}
    </StyledFullScreenDiv>
  )
})

function useFullScreenViewer(
  node: React.ReactElement,
  ref: any
): [() => void, () => void, React.ReactElement | any] {
  const state = useLocalStore(() => ({
    active: false,
    scrolling: false,
    update(data: any) {
      Object.assign(state, data)
    },
  }))

  let div: any = null
  function close() {
    let unmountResult = ReactDOM.unmountComponentAtNode(div)
    if (unmountResult && div.parentNode) {
      div.parentNode.removeChild(div)
    }
    state.update({ active: false })
  }

  function show() {
    div = document.createElement('div')
    const mountNode = document.body
    mountNode.appendChild(div)
    render(
      <MediumZoomOverlay close={close} initRef={ref}>
        {node}
      </MediumZoomOverlay>,
      div
    )
    state.update({ active: true })
  }

  const finalNode = useMemo(() => {
    // 给child添加样式类后展示
    return React.cloneElement(node, {
      className:
        (node.props.className || '') +
        ' medium-zoom-cloned' +
        (state.active ? ' medium-zoom-hidden' : ''),
    })
  }, [state.active, node])

  return [show, close, finalNode]
}
