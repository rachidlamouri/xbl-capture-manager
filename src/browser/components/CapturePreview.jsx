import React, {Component} from 'react'
import {connect} from 'react-redux'
import classNames from 'classnames'

import {closePlayback} from 'browser/redux/actions/playbackActions'

class CapurePreview extends Component{
    constructor(props){
        super(props)
        
        this.onClick = this.onClick.bind(this)
        this.preventClick = this.preventClick.bind(this)
    }
    render(){
        let {props} = this
        let className = classNames('capture-preview', {
            hidden: !props.isPlaying && !props.isLoading,
            loading: props.isLoading,
        })
        return(
            <div className={className} onClick={this.onClick}>
                {props.isPlaying? this.renderVideo(): ''}
            </div>
        )
    }
    renderVideo(){
        let {props} = this
        return(
            <video controls autoPlay onClick={this.preventClick}>
                <source src={'../../../'+props.path} type="video/mp4"/>
            </video>
        )
    }
    
    onClick(event){
        let {props} = this
        if(!props.isLoading){
            props.dispatch(closePlayback())
        }
    }
    preventClick(event){
        event.stopPropagation()
    }
    
    static mapStateToProps(state){
        return {
            path: state.playback.path,
            isPlaying: state.playback.isPlaying,
            isLoading: state.playback.isLoading,
        }
    }
}

export default connect(CapurePreview.mapStateToProps)(CapurePreview)
