import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import 'browser/browser.scss'
import 'common/Debug'

import CaptureBrowser from 'browser/components/CaptureBrowser'

ReactDOM.render(
    <CaptureBrowser/>
, document.getElementById('app-root'))
