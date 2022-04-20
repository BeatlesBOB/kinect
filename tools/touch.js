let offset = 0.05;
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



function numAverage(a) {
    let b = a.length,
    c = 0, i;
    for (i = 0; i < b; i++){
      c += Number(a[i]);
    }
    return c/b;
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


module.exports = (io,kinect) => {

    const touch = async function() {
        const socket = this;
        if (kinect.open()) {
            console.warn("Kinect Opened");
            
            let avgDist = await tryFindDistWall(kinect).toFixed(1)
            console.warn("Le mur est à ",avgDist)
            have_dist = true;
        
            kinect.on('bodyFrame', (bodyFrame) => {
                let nb_peoples = 0
                let personnes = [];
                let response;

                for(var i = 0;  i < bodyFrame.bodies.length; i++) {
                    if (bodyFrame.bodies[i].tracked) {
                        nb_peoples++
                        response = {"nb_peoples": nb_peoples}
                        let people = {};
                        people["left_hand"] = {x: bodyFrame.bodies[i].joints[7].colorX, y: bodyFrame.bodies[i].joints[7].colorY,touch:false}
                        people["right_hand"] = {x: bodyFrame.bodies[i].joints[11].colorX, y: bodyFrame.bodies[i].joints[11].colorY,touch:false }

                        if(bodyFrame.bodies[i].joints[7].cameraZ <= avgDist+offset){
                            people["left_hand"]["touch"] = true
                        }
                        if(bodyFrame.bodies[i].joints[11].cameraZ <= avgDist+offset){
                            people["right_hand"]["touch"] = true
                        }
                        personnes.push(people)
                    }
                }
                response["peoples"] = personnes;
                if(response.peoples.length > 0)  {
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