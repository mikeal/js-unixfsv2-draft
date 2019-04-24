# unixfs-v2 

This library is a full implementation of [`unixfs-v2`](https://github.com/ipfs/unixfs-v2) for JavaScript.

Usage:

```javascript
const unixfs = require('unixfsv2')
const blockstore = require('some-block-store')

const storeDirectory = async path => {
  let last
  for await (let block of unixfs(__dirname)) {
    await blockstore.put(block)
    last = block
  }
  return last.cid.toBaseEncodedString()
}
```

## API

### unixfs.dir(path[, recursive=true][, chunker=fixedChunker(1meg)])

Returns an async generator that yields `Block` instances.

The last block instance returned is the `dag-cbor` block for
the root node.

### unixfs.file(path[, chunker=fixedChunker(1meg)])

Returns an async generator that yields `Block` instances.

The last block instance returned is the `dag-cbor` block for
the root node.

### unixfs.fs(cid, get)

```javascript
const load = async dir => {
  let map = new Map()
  let last
  for await (let block of unixfs.dir(dir)) {
    last = block
    map.set(block.cid.toBaseEncodedString(), block.data)
  }
  return {
    cid: last.cid,
    get: async cid => map.get(cid.toBaseEncodedString())
  }
}

let {cid, get} = await load('/some/directory')

let fs = unixfs(cid, get)
for await (let key of fs.ls('/sub/dir')) {
  console.log(key)
}
for await (let block of fs.read('/sub/dir/file.txt')) {
  console.log(block.cid.toBaseEncodedString())
}
```

`cid` is an instance of `CID`. `get` is an async function that takes
a `CID` instance and returns a `Block` instance from `@ipld/block`.

#### fs.ls(path-to-dir[, objects = false])

Returns an async iterator of keys in the sub directory. If `objects` is set it
will yield the deserialized node for each key in the directory.

#### fs.read(path-to-file)

Returns an async iterator of Blocks for the file.
