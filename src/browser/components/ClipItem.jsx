import React, {Component} from 'react'

class ClipItem extends Component{
    render(){
        let {props} = this
        return(
            <div className="clip-item">
                <img src={'../../../'+props.thumbnail}/>
                <div>{props.clipId}</div>
                <div>{props.dateTaken}</div>
            </div>
        )
    }
}

export default ClipItem
