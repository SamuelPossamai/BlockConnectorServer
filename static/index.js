"use strict";

class DefaultConfBlock extends Block {

    constructor(name, type, x, y, w, h, in_qtd, out_qtd) {
        super(name, x, y, w, h, in_qtd, out_qtd)

        this.type = type;
        this.config = {};

        for(let prop in type.config) {
            if(type.config.hasOwnProperty(prop)) {
                this.config[prop] = type.config[prop] == 'String' ? '' : 0;
            }
        }
    }

    setConfig(prop, value) {

        const prop_type = this.type.config[prop];

        switch(prop_type) {

            case 'Integer':
                this.config[prop] = parseInt(value, 10);
                break;
            case 'Real':
                this.config[prop] = parseFloat(value);
                break;
            default:
                this.config[prop] = value
        }
    }

    saveJSON(stringify) {

        let ret_json = super.saveJSON(false);

        ret_json.config = this.config;
        ret_json.type = this.type.name;

        if(stringify !== false) return JSON.stringify(obj);

        return ret_json;
    }
}

function setElementVisibility(element, visibility) {

    const select_type_modal = document.getElementById(element);

    select_type_modal.style.visibility = visibility;
}

function addBlock() {

    const select_element = document.getElementById("block-type-select");
    const input_element = document.getElementById("block-name-input");

    const block_type_name = select_element.options[select_element.selectedIndex].value;
    const block_type = configblock_types[block_type_name];
    const block_name = input_element.value;

    if(block_name != null) {

        const new_block = new DefaultConfBlock(block_name, block_type, 20, 20, 90, 50,
                                               block_type.n_input, block_type.n_output);

        if(!block_viewer.addBlock(new_block)) {

            alert(`There is already a block named '${block_name}'`)
        }
    }
}

function blockTypeSelectOnClick() {

    setElementVisibility('sel-block-type-root', 'hidden');
    setElementVisibility('sel-block-name-root', 'visible');
}

function deleteButtonOnClick() {

    block_viewer.remBlock(selected_block);

    blockSelected(null);
}

function saveButtonOnClick() {

    axios.post('/blocks/save', block_viewer.saveJSON(), {

        headers: {
            "Accept": "application/json",
            "Content-type": "application/json"
        }
    }).then((response) => { alert('Saved'); }, (error) => { alert('Failed to save'); });
}

function downloadButtonOnClick() {

    var download_data = "data:text/json;charset=utf-8," + encodeURIComponent(block_viewer.saveJSON());
    var download_hidden_link = document.getElementById('download-hidden-link');
    download_hidden_link.setAttribute("href", download_data);
    download_hidden_link.setAttribute("download", "blocks.json");
    download_hidden_link.click();
}

function blockSelected(block) {

    selected_block = block;

    const delete_button = document.getElementById("delete-button");
    const block_name_element = document.getElementById("block-name");
    const block_type_element = document.getElementById("block-type");
    const block_config_element = document.getElementById("block-config");

    if(block == null) {

        block_name_element.innerHTML = "None";
        block_type_element.innerHTML = "None";
        delete_button.disabled = true;
        block_config_element.style.visibility = "hidden";
    }
    else {

        block_name_element.innerHTML = block.name;
        block_type_element.innerHTML = block.type.name;
        delete_button.disabled = false;

        block_config_element.innerHTML = '';
        for(let prop in block.type.config) {
            if(block.type.config.hasOwnProperty(prop)) {

                const new_p_element = document.createElement('p');

                new_p_element.innerHTML = `${prop}: `;

                block_config_element.appendChild(new_p_element);

                const new_input_element = document.createElement('input');

                const new_input_el_id = `block-config-input-${prop}`;

                new_input_element.setAttribute('id', new_input_el_id);
                new_input_element.setAttribute('type', 'text');
                new_input_element.setAttribute('value', block.config[prop]);
                new_input_element.setAttribute(
                    'oninput', `configInputOnChange('${prop}', '${new_input_el_id}');`);

                new_p_element.appendChild(new_input_element);
            }
        }

        block_config_element.style.visibility = "visible";
    }
}

function configInputOnChange(prop, new_input_el_id) {

    const element = document.getElementById(new_input_el_id);

    selected_block.setConfig(prop, element.value);
}

function createBlock(block_json) {

    let new_block =  new DefaultConfBlock(block_json.name, configblock_types[block_json.type],
                                          block_json.x, block_json.y, block_json.width,
                                          block_json.height, block_json.inputs,
                                          block_json.outputs);

    if(block_json.config != null) {

        for(let prop in block_json.config) {
            if(block_json.config.hasOwnProperty(prop)) {
                new_block.setConfig(prop, block_json.config[prop]);
            }
        }
    }

    return new_block;
}

function loadBlocks() {

    axios.get('/blocks/load').then((response) => {

        block_viewer.loadJSON(response.data, false, {create_block: createBlock});

    }, (error) => {})
}

var block_viewer = new CanvasBlockViewer('canvas');
var selected_block = null;
var configblock_types = null;

document.onkeyup = function(event) {

    event = event || window.event;
    if(event.keyCode == 46) {
        if(selected_block != null) deleteButtonOnClick();
    }
};

block_viewer.select_callback = blockSelected;

axios.get('/config/blocks/types').then((response) => {

    configblock_types = response.data;

    const blocktype_select_element = document.getElementById("block-type-select");
    for(let prop in configblock_types) {
        if(configblock_types.hasOwnProperty(prop)) {
            configblock_types[prop].name = prop;

            const new_option_element = document.createElement('option');

            new_option_element.setAttribute('value', prop);
            new_option_element.innerHTML = prop

            blocktype_select_element.appendChild(new_option_element);
        }
    }

    loadBlocks();
})
