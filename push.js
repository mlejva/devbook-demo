import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

const apiKey = process.env.DBK_API_KEY
if (!apiKey) throw new Error('Env var "DBK_API_KEY" is empty')

const csDir = 'code-snippets'
const mapFile = path.join(csDir, 'map.json')

const mapFileContent = fs.readFileSync(mapFile, 'utf-8')
const map = JSON.parse(mapFileContent)

function flushMap(map) {
  const content = JSON.stringify(map)
  fs.writeFileSync(mapFile, content)
}

function createCS(body) {
  return fetch('http://localhost:3000/api/code', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: {'Content-Type': 'application/json'}
  })
  .then(response => response.json())
  .then(data => data.id)
}
function updateCS(body) {
  return fetch('http://localhost:3000/api/code', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {'Content-Type': 'application/json'}
  })
  .then(response => response.json())
  .then(data => data.id)
}

async function main() {
  const { codeSnippets } = map
  const promises = []
  codeSnippets.forEach(cs => {
    const csFile = path.join(csDir, cs.file)
    const code = fs.readFileSync(csFile, 'utf-8')
    let promise
    const body = {
      apiKey,
      env: cs.env,
      isPublished: cs.isPublished || false,
      codeSnippet: {
        code,
        title: cs.title,
      },
    }
    if (cs.id) {
      // Update CS
      body.codeSnippet.id = cs.id
      // Update env only if it has changed.
      // TODO: This isn't really a great solution. It should be done on the server and not just a hash of deps and a template.
      //if (cs.envHash !== envHash) {
      //  body.env = cs.env
      //}
      promise = updateCS(body)
    } else {
      // Create CS
      body.env = cs.env
      promise = createCS(body)
    }
    promises.push(promise)
  })

  const csIDs = await Promise.all(promises)
  console.log('=== Code Snippets =====================')

  for (let idx = 0; idx < codeSnippets.length; idx++) {
    if (idx !== 0) console.log('| ----------------------------------------')

    const csID = csIDs[idx]
    const title = map.codeSnippets[idx].title
    const embed = `https://usedevbook.com/embed/${csID}`
    const url = `https://dashboard-devbook.vercel.app/${csID}`

    map.codeSnippets[idx].id = csID
    map.codeSnippets[idx].embed = embed
    map.codeSnippets[idx].url = url

    console.log('| ID:\t\t', csID)
    console.log('| Title:\t', title)
    console.log('| Public URL:\t', url)
    console.log('| Embed URL:\t', embed)

  }

  console.log('=======================================')


  flushMap(map)
}

main()


function create(title, code, env) {
  const body = {
    apiKey,
    env,
    isPublished: true,
    codeSnippet: {
      code,
      title: 'Apollo Server',
    },
  }
  fetch('http://localhost:3000/api/code', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {'Content-Type': 'application/json'}
  })
  .then(response => response.json())
  .then(data => {
    console.log('response', data)
  })
}

//fs.readdirSync('./code-snippets').forEach(file => {
//  const p = `./code-snippets/${file}`
//  const content = fs.readFileSync(p, 'utf-8')
//  console.log(content)
//
//  const env = {
//    template: 'Nodejs',
//    deps: ['apollo-server'],
//  }
//  create('Apollo Server', content, env)
//});

//const code = ``
//
//const body = {
//  apiKey: '06e53e1b7052b89b85dcd17f855bec31',
//  isPublished: true,
//  codeSnippet: {
//    code,
//    title: 'Apollo Server',
//  },
//  env: {
//    template: 'Nodejs',
//    deps: ['apollo-server'],
//  },
//};
//
//fetch('http://localhost:3000/api/code', {
//	method: 'POST',
//	body: JSON.stringify(body),
//	headers: {'Content-Type': 'application/json'}
//})
//.then(response => response.json())
//.then(data => {
//  console.log('response', data)
//})
