#!/usr/local/bin/node

var loop = function(iteration) {
  console.log("We are piping things!");
  
  if (iteration == 10) {
    return;
  }
  
  setTimeout(function() {
    loop(iteration+1);
  }, 1000);
}

loop(0);