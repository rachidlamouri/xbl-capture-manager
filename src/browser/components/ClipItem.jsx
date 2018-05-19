import React, {Component} from 'react'
import {connect} from 'react-redux'
import {openClip} from 'browser/redux/actions'

class ClipItem extends Component{
    constructor(props){
        super(props)
        
        this.onClick = this.onClick.bind(this)
    }
    render(){
        let {props} = this
        return(
            <div
                className="clip-item"
                onClick={this.onClick}
            >
                <img src={'../../../'+props.thumbnail}/>
                <div className="info">
                    <div>{props.clipId}</div>
                    <div>{props.dateTaken}</div>
                    <div>{props.gamertag}</div>
                    <div>{props.game}</div>
                </div>
            </div>
        )
    }
    
    onClick(event){
        let {props} = this
        props.dispatch(openClip(props.clipId, props.gamertag, props.dateTaken))
    }
}

export default connect()(ClipItem)
