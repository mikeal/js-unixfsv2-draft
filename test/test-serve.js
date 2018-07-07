const {test} = require('tap')
const unixfs = require('../')
const path = require('path')
const bent = require('bent')
const http = require('http')

const getreq = bent()

const fixture = path.join(__dirname, 'fixture')

const fullFixture = async () => {
  let map = new Map()
  let last
  for await (let block of unixfs.dir(fixture, true, 1024)) {
    last = block
    map.set(block.cid.toBaseEncodedString(), block.data)
  }
  return {
    get: async cid => map.get(cid.toBaseEncodedString()),
    cid: last.cid
  }
}

let PORT = 2343

let getServer = handler => {
  PORT++
  return new Promise((resolve, reject) => {
    let server = http.createServer(handler)
    server.listen(PORT, () => {
      resolve({url: `http://localhost:${PORT}`, server})
    })
  })
}

let getText = stream => {
  return new Promise((resolve, reject) => {
    let parts = []
    stream.on('error', reject)
    stream.on('data', chunk => parts.push(chunk))
    stream.on('end', () => {
      resolve(Buffer.concat(parts).toString())
    })
  })
}

test('serve txt file', async t => {
  let {cid, get} = await fullFixture()
  let fs = unixfs.fs(cid, get)
  let {url, server} = await getServer(async (req, res) => {
    await fs.serve(req.url, req, res)
  })
  let res = await getreq(url + '/small.txt')
  t.same(res.headers['content-type'], 'text/plain; charset=utf-8')
  let text = await getText(res)
  t.same(text, 'small text.')
  server.close()
})
