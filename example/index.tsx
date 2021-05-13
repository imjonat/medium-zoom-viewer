import 'react-app-polyfill/ie11'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { MediumZoomViewer } from '../src'

const App = () => {
  return (
    <>
      <MediumZoomViewer>
        <img
          src="https://images.unsplash.com/photo-1593720219276-0b1eacd0aef4"
          alt="example"
          style={{
            width: '40vw',
          }}
        />
      </MediumZoomViewer>

      <MediumZoomViewer>
        <div style={{ background: 'gray', color: 'greenyellow' }}>
          <h1>title</h1>
          <p>line 1</p>
          <p>line 2</p>
        </div>
      </MediumZoomViewer>
    </>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
