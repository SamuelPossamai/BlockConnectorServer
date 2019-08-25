"use strict";

function addButtonOnClick() {

    let block_name = prompt("Block name: ");
    if(block_name != null) {

        if(!block_viewer.addBlock(new Block(block_name, 20, 20, 140, 65, 1, 1))) {

            alert(`There is already a block named '${block_name}'`)
        }
    }
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
    const write_to_element = document.getElementById("write_to");

    if(block == null) {

        write_to_element.innerHTML = "None";
        delete_button.disabled = true;
    }
    else {

        write_to_element.innerHTML = block.name;
        delete_button.disabled = false;
    }
}

var block_viewer = new CanvasBlockViewer('canvas');
var selected_block = null;

block_viewer.select_callback = blockSelected;

let block1 = new Block('name1', 100, 200, 70, 70, 0, 1);

block1.font = "16px Georgia";
block_viewer.addBlock(block1);
block_viewer.addBlock(new Block('name2', 400, 300, 140, 65, 3, 2));
block_viewer.addBlock(new Block('name3', 600, 300, 140, 65, 2, 0));
