let offset = 0.10;
let have_dist = false;
let have_max = false;
let have_min = false;

function findDistWall(kinect) {
    return new Promise((resolve, reject) => 
    {
        let distWall = [];    
        kinect.on('bodyFrame', (bodyFrame) => {
            if(!have_dist){
                for(var i = 0;  i < bodyFrame.bodies.length; i++) {
                    if (bodyFrame.bodies[i].tracked) {
                        distWall.push(bodyFrame.bodies[i].joints[3].cameraZ)
                        console.log("Tracking....");
                    }
                }
            }

        });
            
        kinect.openBodyReader()
        setTimeout(function(){
            if(distWall.length > 25) {
                kinect.closeBodyReader().then(()=>{
                    console.warn("Resolve");
                    resolve(numAverage(distWall));

                });
            } else {
                kinect.closeBodyReader().then(()=>{
                    console.warn("Reject");
                    reject(Error("Rejected"))
                });
            }
        },5000);
    });
}

function findMax(kinect) {
    return new Promise((resolve, reject) => 
    {
        let Max = [];    
        kinect.on('bodyFrame', (bodyFrame) => {
            if(!have_max){
                for(var i = 0;  i < bodyFrame.bodies.length; i++) {
                    if (bodyFrame.bodies[i].tracked) {
                        Max.push({x:bodyFrame.bodies[i].joints[7].colorX,y:bodyFrame.bodies[i].joints[7].colorY})
                        console.log("Max tracking....");
                    }
                }
            }

        });
            
        kinect.openBodyReader()
        setTimeout(function(){
            if(Max.length > 25) {
                kinect.closeBodyReader().then(()=>{
                    console.warn("Resolve max");
                    resolve(coordAverage(Max));
                });
            } else {
                kinect.closeBodyReader().then(()=>{
                    console.warn("Reject");
                    reject(Error("Rejected"))
                });
            }
        },5000);
    });
}

function findMin(kinect) {
    return new Promise((resolve, reject) => 
    {
        let Min = [];    
        kinect.on('bodyFrame', (bodyFrame) => {
            if(!have_min){
                for(var i = 0;  i < bodyFrame.bodies.length; i++) {
                    if (bodyFrame.bodies[i].tracked) {
                        Min.push({x:bodyFrame.bodies[i].joints[11].colorX,y:bodyFrame.bodies[i].joints[11].colorY})
                        console.log("Min tracking....");
                    }
                }
            }

        });
            
        kinect.openBodyReader()
        setTimeout(function(){
            if(Min.length > 25) {
                kinect.closeBodyReader().then(()=>{
                    console.warn("Resolve");
                    resolve(coordAverage(Min));

                });
            } else {
                kinect.closeBodyReader().then(()=>{
                    console.warn("Reject");
                    reject(Error("Rejected"))
                });
            }
        },5000);
    });
}

function numAverage(a) {
    let b = a.length,
    c = 0, i;
    for (i = 0; i < b; i++){
      c += Number(a[i]);
    }
    return c/b;
}

function coordAverage(a) {
    let b = a.length;
    let xAvg = 0;
    let yAvg = 0
    for (let i = 0; i < b; i++){
        xAvg += Number(a[i].x);
        yAvg += Number(a[i].y);
    }
    return {x:xAvg/b,y:yAvg/b};
}


async function tryFindDistWall(kinect){
    let v = await new Promise((resolve,reject) => setTimeout(async()=>{
        let response
        try {
            response = await findDistWall(kinect)
        } catch(e){
            reject()
        }
        resolve(response)
    },3000)).catch(async () =>{
        console.warn("Retry Dist")
        v = await tryFindDistWall(kinect)
    });
   return v
}

async function tryFindMax(kinect){
    let v = await new Promise((resolve,reject) => setTimeout(async()=>{
        let response
        try {
            response = await findMax(kinect)
        } catch(e){
            reject()
        }
        resolve(response)
    },3000)).catch(async () =>{
        console.warn("Retry Max")
        v = await tryFindMax(kinect)
    });
   return v
}

async function tryFindMin(kinect){
    let v = await new Promise((resolve,reject) => setTimeout(async()=>{
        let response
        try {
            response = await findMin(kinect)
        } catch(e){
            reject()
        }
        resolve(response)
    },3000)).catch(async () =>{
        console.warn("Retry Min")
        v = await tryFindMin(kinect)
    });
   return v
}

module.exports = (io,kinect) => {

    const touch = async function() {
        const socket = this;
        if (kinect.open()) {
            console.warn("Kinect Opened");
            
            let avgDist = await tryFindDistWall(kinect)
            console.warn("Le mur est à ",avgDist)
            have_dist = true;
            
            let t = await tryFindMin(kinect)
            console.warn("Le poutou est à ",t)
            have_min = true;
            
            let b = await tryFindMax(kinect)
            console.warn("Le z est à ",b)
            have_max = true;

            let r = {x:b.x,y:t.y} 
            let l = {x:t.x,y:b.y}

            let height = l.y - r.y;
            let width = r.x - t.x;

            kinect.on('bodyFrame', (bodyFrame) => {
                let nb_peoples = 0
                let personnes = [];
                let response;

                for(var i = 0;  i < bodyFrame.bodies.length; i++) {
                    if (bodyFrame.bodies[i].tracked && (bodyFrame.bodies[i].joints[7].cameraZ >= avgDist-offset  || bodyFrame.bodies[i].joints[11].cameraZ >= avgDist-offset)) {
                        if((bodyFrame.bodies[i].joints[7].colorX >= t.x && bodyFrame.bodies[i].joints[7].colorX < b.x) && (bodyFrame.bodies[i].joints[7].colorY > t.y && bodyFrame.bodies[i].joints[7].colorY < b.y)){
                            nb_peoples++
                            response = {"nb_peoples": nb_peoples}
                            let people = {}
                                                        
                            if(bodyFrame.bodies[i].joints[7].cameraZ >= avgDist-offset){
                                let left_hand = {x: 1 - ((bodyFrame.bodies[i].joints[7].colorX / width) - t.x), y:(bodyFrame.bodies[i].joints[7].colorY / height) - t.y}
                                people["left_hand"] = left_hand
                                // {
                                //     "x": bodyFrame.bodies[i].joints[7].colorX,
                                //     "y": bodyFrame.bodies[i].joints[7].colorY,
                                // }
                            }
    
                            if(bodyFrame.bodies[i].joints[11].cameraZ >= avgDist-offset){
                                let right_hand = {x: 1 - ((bodyFrame.bodies[i].joints[11].colorX / width) - t.x), y: (bodyFrame.bodies[i].joints[11].colorY / height) - t.y}
                                people["right_hand"] = right_hand
                                // {
                                //     "x": bodyFrame.bodies[i].joints[11].colorX,
                                //     "y": bodyFrame.bodies[i].joints[11].colorY,
                                // }
                            }
                            personnes.push(people)
                            
                        }
                    }
                }
                response["peoples"] = personnes
                if(response)  {
                    socket.emit('touch',response)
                }
            });
            kinect.openBodyReader();
        } else {
            console.log("Kinect could not be openend");
        } 
    };
    return {touch}
}