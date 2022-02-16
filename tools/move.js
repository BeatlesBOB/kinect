let isOpen = false

module.exports = (io,kinect) => {
    const move =  function (){
        const socket = this; 
        if (kinect.open()) {
            console.log("Kinect Opened");
            //listen for body frames
            kinect.on('bodyFrame', (bodyFrame) => {
                let nb_peoples = 0;
                let personnes = []
                let response
                for(var i = 0;  i < bodyFrame.bodies.length; i++) {
                    if (bodyFrame.bodies[i].tracked) {
                        nb_peoples++
                        response = {"nb_peoples": nb_peoples}
                        personnes.push({
                            "head": {
                                "x": bodyFrame.bodies[i].joints[3].colorX,
                                "y": bodyFrame.bodies[i].joints[3].colorY,
                            },
                            "right_hand": {
                                "x": bodyFrame.bodies[i].joints[11].colorX,
                                "y": bodyFrame.bodies[i].joints[11].colorY,
                            },
                            "left_hand": {
                                "x": bodyFrame.bodies[i].joints[7].colorX,
                                "y": bodyFrame.bodies[i].joints[7].colorY,
                            },
                        })
                    }   
                }
                response["peoples"] = personnes
                if(response){
                    socket.emit('move',response)
                }
        });
        if(!isOpen){
            kinect.openBodyReader();
        }
        } else {
            console.log("Kinect could not be openend");
        }
    };
    return {
        move,
    }
}

