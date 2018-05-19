import React, {Component} from 'react'

class DropdownOption extends Component{
    render(){
        let {props, state} = this
        return(
            <div className="dropdown-option" onClick={props.onClick}>
                {props.label}
            </div>
        )
    }
}

class Dropdown extends Component{
    constructor(props){
        super(props)
        
        this.onBlur = this.onBlur.bind(this)
        this.onClick = this.onClick.bind(this)
        
        this.state = {
            isOpen: false,
        }
    }
    
    render(){
        let {props, state} = this
        return(
            <div className="dropdown" onClick={this.onClick} tabIndex={0} onBlur={this.onBlur}>
                <div className="dropdown-display">
                    <div className="dropdown-text">{props.displayText}</div>
                    <i className="fas fa-caret-down"/>
                </div>
                {state.isOpen? this.renderMenu(): ''}
            </div>
        )
    }
    renderMenu(){
        let {props} = this
        return(
            <div className="dropdown-menu">
                {this.renderOptions()}
            </div>
        )
    }
    renderOptions(){
        let {props} = this
        return props.configList.map((optionConfig, index)=>{
            return(
                <DropdownOption
                    key={index}
                    value={optionConfig.value}
                    label={optionConfig.label}
                    onClick={()=>{
                        props.onOption(optionConfig.value, optionConfig.label)
                    }}
                />
            )
        })
    }
    
    onBlur(event){
        this.setState({
            isOpen: false,
        })
    }
    onClick(event){
        let {state} = this
        this.setState({
            isOpen: !state.isOpen,
        })
    }
}

export default Dropdown
