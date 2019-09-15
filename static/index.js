"use strict";

class DefaultConfBlock extends Block {

    constructor(name, type, x, y, w, h, in_qtd, out_qtd) {
        super(name, x, y, w, h, in_qtd, out_qtd)

        this.type = type;
        this.config = {};

        for(let prop in type.config) {
            if(type.config.hasOwnProperty(prop)) {
                switch(type.config[prop]) {

                    case 'Integer':
                    case 'Real':
                        this.config[prop] = 0;
                        break;
                    default:
                        this.config[prop] = '';
                }
            }
        }

        if(type.bg_color != null) this.bg_color = type.bg_color;
        if(type.fg_color != null) this.fg_color = type.fg_color;
        if(type.border_color != null) this.border_color = type.border_color;
        if(type.sel_border_color != null) {

            this.sel_border_color = type.sel_border_color;
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

function runButtonOnCLick() {

    axios.get('/blocks/run');
}

function downloadButtonOnClick() {

    let download_data = "data:text/json;charset=utf-8," + encodeURIComponent(block_viewer.saveJSON());
    let download_hidden_link = document.getElementById('download-hidden-link');
    download_hidden_link.setAttribute("href", download_data);
    download_hidden_link.setAttribute("download", "blocks.json");
    download_hidden_link.click();
}

function uploadFileSelected(event) {

    let freader = new FileReader();

    freader.onload = (evt) => {

        block_viewer.loadJSON(evt.target.result, true, {
            create_block: createBlock,
            clear_before: true
        });
    }

    freader.readAsText(event.target.files[0], 'UTF-8');
}

function uploadButtonOnClick() {

    document.getElementById('upload-file-hidden-input').click();
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

                const prop_type_all = block.type.config[prop];
                const prop_type_split = prop_type_all.split('(');

                const prop_type = prop_type_split[0];

                let prop_type_args;

                if(prop_type_split.length == 2) {

                    prop_type_args = prop_type_split[1].slice(0, -1).split(',');
                }
                else prop_type_args = [];

                let new_input_element;
                if(prop_type == 'Text') {

                    new_input_element = document.createElement('textarea');

                    new_input_element.setAttribute

                    let cols = 80;
                    let rows = 10;
                    if(prop_type_args.length >= 1) cols = prop_type_args[0];
                    if(prop_type_args.length >= 2) rows = prop_type_args[1];

                    new_input_element.setAttribute('cols', cols);
                    new_input_element.setAttribute('rows', rows);

                    new_input_element.style.resize = 'none';
                }
                else {

                    new_input_element = document.createElement('input');
                }

                if(prop_type == 'Integer') new_input_element.pattern = '^[-+]?[0-9]+$';
                if(prop_type == 'Real') new_input_element.pattern = '^[-+]?([0-9]+[.]?[0-9]*|[.][0-9]+)$';

                const new_input_el_id = `block-config-input-${prop}`;

                new_input_element.setAttribute('id', new_input_el_id);
                new_input_element.setAttribute('type', 'text');
                new_input_element.value = block.config[prop];
                new_input_element.setAttribute(
                    'oninput', `configInputOnChange('${prop}', '${new_input_el_id}');`);

                if(prop_type == 'Text') block_config_element.appendChild(new_input_element);
                else new_p_element.appendChild(new_input_element);
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

function loadConsoleText() {

    if(typeof loadConsoleText.line_number == 'undefined') {

        loadConsoleText.line_number = 0;
    }

    axios.get(`/console/read/after/${loadConsoleText.line_number}`).then((response) => {

        let element = document.getElementById('console-modal-text');
        let console_default = response.data.console.default;

        if(console_default != null) {

            if(element.innerHTML != '') {
                element.innerHTML += '\n';
            }
            element.innerHTML += console_default;
            loadConsoleText.line_number = response.data.current_line.default;
            element.scrollTop = element.scrollHeight;
        }

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

loadConsoleText();
setInterval(loadConsoleText, 1500);
