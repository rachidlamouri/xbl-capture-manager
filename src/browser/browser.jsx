import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import 'browser/browser.scss'
import 'common/Debug'

import {createStore, applyMiddleware} from 'redux'
import thunkMiddleware from 'redux-thunk'
import {initialAppState} from 'browser/redux/initialAppState'
import rootReducer from 'browser/redux/rootReducer'

import {Provider} from 'react-redux'
import CaptureBrowser from 'browser/components/CaptureBrowser'

const store = createStore(
    rootReducer,
    initialAppState(),
    applyMiddleware(thunkMiddleware),
)

ReactDOM.render(
    <Provider store={store}>
        <CaptureBrowser/>
    </Provider>
, document.getElementById('app-root'))
