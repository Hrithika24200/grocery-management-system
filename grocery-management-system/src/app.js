// This file contains the main JavaScript code for the grocery management system.
// It initializes the application, sets up event listeners, and manages overall functionality.

document.addEventListener('DOMContentLoaded', () => {
    console.log('Grocery Management System Initialized');

    // Example of setting up an event listener
    const addItemButton = document.getElementById('add-item');
    if (addItemButton) {
        addItemButton.addEventListener('click', () => {
            // Logic to add an item to the inventory
            console.log('Add Item button clicked');
        });
    }

    // Additional initialization code can go here
});

let inventory = JSON.parse(localStorage.getItem('inventory')) || [];

const addItemForm = document.getElementById('add-item-form');
const inventoryBody = document.getElementById('inventory-body');

// Render inventory table
function renderInventory() {
    inventoryBody.innerHTML = '';
    inventory.forEach((item, index) => {
        const row = document.createElement('tr');
        if (item.editing) {
            row.innerHTML = `
                <td><input type="text" id="edit-name-${index}" value="${item.name}"></td>
                <td><input type="number" id="edit-quantity-${index}" value="${item.quantity}" min="1"></td>
                <td><input type="text" id="edit-category-${index}" value="${item.category}"></td>
                <td>
                    <button class="action-btn" onclick="saveEdit(${index})">Save</button>
                    <button class="action-btn" onclick="cancelEdit(${index})">Cancel</button>
                </td>
            `;
        } else {
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${item.category}</td>
                <td>
                    <button class="action-btn" onclick="editItem(${index})">Edit</button>
                    <button class="action-btn" onclick="deleteItem(${index})">Delete</button>
                </td>
            `;
        }
        inventoryBody.appendChild(row);
    });
    localStorage.setItem('inventory', JSON.stringify(inventory));
}

// Add item event
addItemForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('item-name').value.trim();
    const quantity = parseInt(document.getElementById('item-quantity').value, 10);
    const category = document.getElementById('item-category').value.trim();

    if (name && quantity > 0 && category) {
        inventory.push({ name, quantity, category, editing: false });
        renderInventory();
        addItemForm.reset();
    }
});

// Edit item
window.editItem = function(index) {
    inventory[index].editing = true;
    renderInventory();
};

// Save edit
window.saveEdit = function(index) {
    const name = document.getElementById(`edit-name-${index}`).value.trim();
    const quantity = parseInt(document.getElementById(`edit-quantity-${index}`).value, 10);
    const category = document.getElementById(`edit-category-${index}`).value.trim();
    if (name && quantity > 0 && category) {
        inventory[index] = { name, quantity, category, editing: false };
        renderInventory();
    }
};

// Cancel edit
window.cancelEdit = function(index) {
    inventory[index].editing = false;
    renderInventory();
};

// Delete item with confirmation
window.deleteItem = function(index) {
    if (confirm('Are you sure you want to delete this item?')) {
        inventory.splice(index, 1);
        renderInventory();
    }
};

// Clear all inventory
function clearInventory() {
    if (confirm('Clear all items from inventory?')) {
        inventory = [];
        renderInventory();
    }
}

// Add clear button to the DOM
const inventorySection = document.getElementById('inventory-section');
const clearBtn = document.createElement('button');
clearBtn.textContent = 'Clear Inventory';
clearBtn.className = 'action-btn';
clearBtn.style.margin = '1rem 0';
clearBtn.onclick = clearInventory;
inventorySection.insertBefore(clearBtn, inventorySection.children[1]);

// Initial render
renderInventory();

// Shopping List Feature
const shoppingForm = document.getElementById('shopping-list-form');
const shoppingInput = document.getElementById('shopping-item-input');
const shoppingList = document.getElementById('shopping-list');
let shoppingItems = JSON.parse(localStorage.getItem('shoppingList')) || [];

function renderShoppingList() {
    shoppingList.innerHTML = '';
    shoppingItems.forEach((item, idx) => {
        const li = document.createElement('li');
        li.textContent = item;
        const btn = document.createElement('button');
        btn.textContent = 'Remove';
        btn.className = 'remove-btn';
        btn.onclick = () => {
            shoppingItems.splice(idx, 1);
            localStorage.setItem('shoppingList', JSON.stringify(shoppingItems));
            renderShoppingList();
        };
        li.appendChild(btn);
        shoppingList.appendChild(li);
    });
}
if (shoppingForm) {
    shoppingForm.addEventListener('submit', e => {
        e.preventDefault();
        const value = shoppingInput.value.trim();
        if (value) {
            shoppingItems.push(value);
            localStorage.setItem('shoppingList', JSON.stringify(shoppingItems));
            shoppingInput.value = '';
            renderShoppingList();
        }
    });
}
renderShoppingList();

// Available Items Display (reads from inventory in localStorage)
const availableItemsDiv = document.getElementById('available-items');
function renderAvailableItems() {
    availableItemsDiv.innerHTML = '';
    const inventory = JSON.parse(localStorage.getItem('inventory')) || [];
    if (inventory.length === 0) {
        availableItemsDiv.innerHTML = '<p>No items in inventory yet.</p>';
        return;
    }
    inventory.forEach(item => {
        const card = document.createElement('div');
        card.className = 'available-item-card';
        card.textContent = `${item.name} (${item.quantity})`;
        availableItemsDiv.appendChild(card);
    });
}
renderAvailableItems();