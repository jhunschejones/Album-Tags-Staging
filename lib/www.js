const newrelic = require('newrelic')
const cluster = require('cluster')

// this code runs in the master process
if (cluster.isMaster) {
  // count the machine's CPU's
  const cpuCount = require('os').cpus().length
  let workerCount

  // create a worker for each CPU, limit 4
  if (cpuCount > 4) { workerCount = 4 } 
  else { workerCount = cpuCount }

  for (let i = 0; i < workerCount; i += 1) {
    cluster.fork()
  }

  // listen for dying workers
  cluster.on('exit', function (worker) {
    console.log("Worker %d died :(", worker.id)
    const deadWorker = worker.id
    newrelic.recordMetric('Custom/Backend/WorkerDown', deadWorker)
    newrelic.recordCustomEvent('WorkerDeath', {'Dead Worker': deadWorker})

    // replace the dead worker
    cluster.fork()
  }) 
} else {
  // this code runs in a worker process
  const app = require('../app')
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`Albumtags worker ${cluster.worker.id} is running on port ${PORT}.`)
  })
}