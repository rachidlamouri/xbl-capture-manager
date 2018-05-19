import React, {Component} from 'react'
import {connect} from 'react-redux'
import {getClips} from 'browser/redux/actions'

import CapturePreview from 'browser/components/CapturePreview'
import ClipItem from 'browser/components/ClipItem'

class CaptureBrowser extends Component{
    render(){
        let {props} = this
        return(
            <div className="capture-browser">
                <CapturePreview/>
                <div className="clip-items">
                    {props.clips}
                </div>
            </div>
        )
    }
    
    componentDidMount(){
        let {props} = this
        props.dispatch(getClips())
    }
    
    static getClipItems(records){
        return records.map((record)=>{
            return(
                <ClipItem
                    key={record.Id}
                    thumbnail={record.thumbnail}
                    clipId={record.Id}
                    dateTaken={record.DateTaken}
                    game={record.GameName}
                    gamertag={record.Gamertag}
                />
            )
        })
    }
    
    static mapStateToProps(state){
        return {
            clips: CaptureBrowser.getClipItems(state.clips.records),
        }
    }
}

export default connect(CaptureBrowser.mapStateToProps)(CaptureBrowser)
