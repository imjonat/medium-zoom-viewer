import 'react-app-polyfill/ie11'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { MediumZoomViewer } from '../src'

const App = () => {
  return (
    <MediumZoomViewer>
      <img
        src="https://images.unsplash.com/photo-1593720219276-0b1eacd0aef4"
        alt="example"
        style={{
          width: '40vw',
        }}
      />
    </MediumZoomViewer>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
