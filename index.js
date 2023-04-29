// get all squares on the board
let allSquares = document.getElementsByClassName("square");
let startButton = document.getElementById("start");
let resetButton = document.getElementById("clear");
let widthInput = document.getElementById("width");
let heightInput = document.getElementById("height");
let confirmButton = document.getElementById("confirm");
let mainBoard = document.getElementById("board");

let squareWidth = 40;
let squareHeight = 40;

let width = 20;
let height = 20;
let board = [];
let obstacles = [];
let startNode = null;
let targetNode = null;
let isAddingObstacles = false; // new flag to indicate if "p" key is being held down

class PriorityQueue { // priority queue class, takes a data and priority, uses the priority to check where to put the data in the queue, the lower the priority the closer to the head the data is going to be inserted.
    constructor() {
    this.heap = [null];
    }

    insert(node, path, priority) { // does the insertion
        const newNode = { node, path, priority };

        this.heap.push(newNode);
        let currentIndex = this.heap.length - 1;
    
        while (
            currentIndex > 1 &&
            this.heap[Math.floor(currentIndex / 2)].priority > newNode.priority
        ) {
            this.swap(currentIndex, Math.floor(currentIndex / 2));
            currentIndex = Math.floor(currentIndex / 2);
        }
    }

    remove() { // removes and returns the current head of the queue
        if (this.heap.length <= 1) {
            return null;
        }
    
        const removedNode = this.heap[1];
        
        if (this.heap.length === 2) {
            this.heap.pop();
        } else {
            this.heap[1] = this.heap.pop();
    
            let currentIndex = 1;
            let leftChildIndex = currentIndex * 2;
            let rightChildIndex = currentIndex * 2 + 1;
    
            while (
                (this.heap[leftChildIndex] &&
                this.heap[currentIndex].priority > this.heap[leftChildIndex].priority) ||
                (this.heap[rightChildIndex] &&
                this.heap[currentIndex].priority > this.heap[rightChildIndex].priority)
            ) {
                if (
                !this.heap[rightChildIndex] ||
                this.heap[leftChildIndex].priority < this.heap[rightChildIndex].priority
                ) {
                    this.swap(currentIndex, leftChildIndex);
                    currentIndex = leftChildIndex;
                } else {
                    this.swap(currentIndex, rightChildIndex);
                    currentIndex = rightChildIndex;
                }
    
                leftChildIndex = currentIndex * 2;
                rightChildIndex = currentIndex * 2 + 1;
            }
        }
        return removedNode;
    }
    

    swap(i, j) { // swapes between 2 elements
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }

    isEmpty() { // checks if the queue is empty
        return this.heap.length <= 1;
    }
    
}

class Node{ // node class used to keep track of the data of all nodes
    constructor(location){
        this.location = location;
        this.xPos = location[0];
        this.yPos = location[1];
        this.square = allSquares[this.yPos*height + this.xPos];
        this.children = [];
        this.gCost;
        this.hCost;
        this.fCost;
    }
    initializeChildren = function(){
        if(this.children.length > 0){
            this.children = [];
        }
        if (this.xPos > 0){
            this.children.push(getNodeFromLocation([this.xPos - 1, this.yPos]));
            
            if (this.yPos > 0){
                this.children.push(getNodeFromLocation([this.xPos - 1, this.yPos - 1]));
            }
            if (this.yPos < height - 1){
                this.children.push(getNodeFromLocation([this.xPos - 1, this.yPos + 1]));
            }
        }
        if (this.xPos < width - 1){
            this.children.push(getNodeFromLocation([this.xPos + 1, this.yPos]));
            
            if (this.yPos > 0){
                this.children.push(getNodeFromLocation([this.xPos + 1, this.yPos - 1]));
            }
            if (this.yPos < height - 1){
                this.children.push(getNodeFromLocation([this.xPos + 1, this.yPos + 1]));
            }
        }
        if(this.yPos > 0){
            this.children.push(getNodeFromLocation([this.xPos, this.yPos - 1]));
        }
        if(this.yPos < height - 1){
            this.children.push(getNodeFromLocation([this.xPos, this.yPos + 1]));
        }
    }
}

function setBoard(){ // create all the nodes and places them in their respective positions on the board
    for(let i = 0; i < height; i++){
        let line = [];
        for(let j = 0; j < width; j++){
            line.push(new Node([j, i]));
        }
        board.push(line);
    }
}

function getNodeFromLocation(location){ // gets a node from a given location on the board
    for(let i = 0; i < height; i++){
        for(let j = 0; j < width; j++){
            let currentNode = board[j][i];
            if(currentNode.xPos == location[0] && currentNode.yPos == location[1]){
                return currentNode;
            }
        }
    }
}

function setAllChildren(){ // after the board is initialized connect all the nodes to one another (the children of a node are the nodes sorrounding it)
    for(let i = 0; i < height; i++){
        for(let j = 0; j < width; j++){
            let currentNode = board[j][i];
            currentNode.initializeChildren();
        }
    }
}

function clearColor(color){ // clears all colors of a given rgb value on the board
    for(let i = 0; i < allSquares.length; i++){
        if(getComputedStyle(allSquares[i]).backgroundColor == color){
            allSquares[i].style.backgroundColor = "rgb(255, 255, 255)";
        }
    }
}

function heuristic(firstNode, targetNode){ // a heuristic (euclidian distance formula), used to calculate the hCost of a given node (hCost is the distance between a node and the target)
    let firstX = firstNode.xPos;
    let targetX = targetNode.xPos;
    let firstY = firstNode.yPos;
    let targetY = targetNode.yPos;
    return Math.sqrt(Math.pow(firstX - targetX, 2) + Math.pow(firstY - targetY, 2));
}

function Astar(startNode, targetNode){

    // calculate the fCost of the starting node
    startNode.gCost = 0
    startNode.hCost = heuristic(startNode, targetNode);
    startNode.fCost = startNode.hCost + startNode.gCost;

    // initialize the priorityQueue and the visited list
    let visited = [];
    let queue = new PriorityQueue();
    
    // insert the startNode into the queue
    queue.insert(startNode, [], startNode.fCost);
    while (!queue.isEmpty()){ // while the queue is not empty

        // get the currentNode and the path
        let { node: currentNode, path } = queue.remove();
        path = [...path, currentNode];

        if (!visited.includes(currentNode)){
            // push the currentNode into the visited list
            visited.push(currentNode);

            // check if current node is the target
            if (currentNode.location[0] == targetNode.location[0] && currentNode.location[1] == targetNode.location[1]){
                return path;
            }
    
            // if the current node is not the target
            for (let i = 0; i < currentNode.children.length; i++) { // loop through all children
    
                let childNode = currentNode.children[i]; // get the child node at index i
    
                if (!visited.includes(childNode) && !obstacles.includes(childNode)) { // checks if child is not obstacle and was never vistied
    
                    // determines weight for the next move (horizontal/vertical = 1, diagonal = 1.14)
                    let weight = 1;
                    if (Math.abs(childNode.xPos - currentNode.xPos) === 1 && Math.abs(childNode.yPos - currentNode.yPos) === 1) { 
                        weight = 1.14
                    }
    
                    // calculate the costs of the childnode
                    childNode.gCost = currentNode.gCost + weight;
                    childNode.hCost = heuristic(childNode, targetNode);
                    childNode.fCost = childNode.gCost + childNode.hCost;
                    // insert the childnode into the priority queue (since its a priority queue, the lower the fCost the sooner the node will be explored)
                    queue.insert(childNode, path, childNode.fCost);
                }
            }
        }

    }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms)); // sleep function using promises

function startListeners(){ // starts all button and mouse listeners

    for(let i = 0; i < height; i++){
        for(let j = 0; j < width; j++){
            let currentNode = board[i][j];
            let currentSquare = currentNode.square;
            currentSquare.addEventListener('click', function handleClick(){
                clearColor("rgb(255, 0, 0)");
                currentSquare.style.backgroundColor = "rgb(255, 0, 0)";
                startNode = currentNode;
                console.log(startNode);
            })
        }
    }

    onkeydown = function handleKey(e){
        e = e || window.event;
        let hovered = document.querySelectorAll(":hover");
        if (e.key == "p"){
            isAddingObstacles = true;
        }

        if (e.key == "g"){
            for(let i = 0; i < height; i++){
                for(let j = 0; j < width; j++){
                    let currentNode = board[i][j];
                    let currentSquare = currentNode.square;
                    if (Array.from(hovered).includes(currentSquare)){
                        clearColor("rgb(23, 152, 228)");
                        targetNode = currentNode;
                        currentSquare.style.backgroundColor = "rgb(23, 152, 228)";
                    }
                }
            }
        }
    }
    onkeyup = function handleKey(e) {
        e = e || window.event;
        if (e.key == "p") {
          isAddingObstacles = false; // unset flag to indicate no longer adding obstacles
        }
    };
    
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          let currentNode = board[i][j];
          let currentSquare = currentNode.square;
          currentSquare.addEventListener("mousemove", function handleMouseMove() {
            if (isAddingObstacles) { // check if flag is set to add obstacles
              currentSquare.style.backgroundColor = "rgb(228, 200, 23)";
              obstacles.push(currentNode);
            }
          });
        }
    }

    startButton.addEventListener("click", async function handleStart(){
        clearColor("rgb(23, 182, 66)");
        if(startNode != null && targetNode != null){
            let path = Astar(startNode, targetNode);
            console.log(path)
            for(let i = 0; i < path.length; i++){
                let currentNode = path[i];
                currentNode.square.style.backgroundColor = "rgb(23, 182, 66)";
                await sleep(100);
            }
        }
    })

    resetButton.addEventListener("click", function handleReset(){ // resets the board to its original state
        obstacles = [];
        clearColor("rgb(23, 182, 66)");
        clearColor("rgb(228, 200, 23)");
        clearColor("rgb(255, 0, 0)");
        clearColor("rgb(23, 152, 228)");
        startNode = null;
        targetNode = null;

    })

    confirmButton.addEventListener('click', function handleSize(){
        let widthToChange = parseInt(widthInput.value)
        let heightToChange = parseInt(heightInput.value)
        if (widthToChange >= 10 && widthToChange <= 47 && heightToChange >= 10 && heightToChange <= 47){
            let newSquareWidth = squareWidth * (width / widthToChange);
            let newSquareHeight = squareHeight * (height / heightToChange);
    
            width = widthToChange;
            height = heightToChange;
    
            mainBoard.innerHTML = "";
    
            for(let i = 0; i < height; i++){
                let line = document.createElement('div');
                line.classList.add("line");
                for(let j = 0; j < width; j++){
                    let newSquare = document.createElement('div');
                    newSquare.classList.add("square");
                    newSquare.style.width = newSquareWidth.toString() + "px";
                    newSquare.style.height = newSquareHeight.toString() + "px";
                    line.appendChild(newSquare)
                }
                mainBoard.appendChild(line)
            }
            allSquares = document.getElementsByClassName("square");
            board = [];
            main();
        }
    })
}

function main(){ // calls all necessary functions
    setBoard();
    setAllChildren();
    startListeners();
}

main();