const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, `covid19India.db`)

const app = express()

app.use(express.json())

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const convertStateDbObjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}
const convertDistrictDbObjectToResponseObject = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.cured,
    deaths: dbObject.deaths,
  }
}
// API 1

app.get('/states/', async (request, response) => {
  const getstatesQuery = `
    SELECT
     *
    FROM
      state;`
  const statesArray = await database.all(getstatesQuery)
  response.send(
    statesArray.map(eachstate =>
      convertStateDbObjectToResponseObject(eachstate),
    ),
  )
})

// API 2

app.get(`/states/:stateId/`, async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
    SELECT 
      *
    FROM 
      state
    WHERE 
      state_id = ${stateId};`
  const state = await database.get(getStateQuery)
  response.send(convertStateDbObjectToResponseObject(state))
})

// API 3

app.post(`/districts/`, async (request, response) => {
  const {stateId, districtName, cases, cured, active, deaths} = request.body
  const postDistrictQuery = `
  INSERT INTO
    district ( state_id, district_name, cases, cured, active, deaths)
  VALUES
    (${stateId}, '${districtName}', ${cases}, ${cured}, ${active}, ${deaths});`
  await database.run(postDistrictQuery)
  response.send('District Successfully Added')
})

// API 4

app.get(`/districts/:districtId/`, async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
    SELECT 
      *
    FROM 
      district
    WHERE 
      district_id = ${districtId};`
  const district = await database.get(getDistrictQuery)
  response.send(convertStateDbObjectToResponseObject(district))
})

// API 5

app.delete(`/districts/:districtId/`, async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
    DELETE
    FROM 
      district
    WHERE 
      district_id = ${districtId};`
  await database.run(deleteDistrictQuery)
  response.send('District Removed')
})

// API 6

app.put(`/districts/:districtId/`, async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const {districtId} = request.params
  const UpdateQuery = `
            UPDATE district 
            SET 
                district_name='${districtName}',
                state_id=${stateId},
                cases=${cases},
                cured=${cured},
                active=${active},
                deaths=${deaths}
            WHERE district_id=${districtId};`
  await database.run(UpdateQuery)
  response.send('District Details Updated')
})

// API 7

app.get(`/states/:stateId/stats/`, async (request, response) => {
  const {stateId} = request.params
  const getStateStatsQuery = `
  SELECT
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
  FROM
    district
  WHERE
    state_id = ${stateId};`
  const stats = await database.get(getStateStatsQuery)
  console.log(stats)

  response.send({
    totatCases: stats['SUM(cases)'],
    totatCured: stats['SUM(cured)'],
    totatActive: stats['SUM(active)'],
    totatDeaths: stats['SUM(deaths)'],
  })
})

// API 8

app.get(`/districts/:districtId/details/`, async (request, response) => {
  const {districtId} = request.params
  const getDistrictIdQuery = `
    select state_id from district
    where district_id = ${districtId};
    `
  const getDistrictIdQueryResponse = await database.get(getDistrictIdQuery)
  const getStateNameQuery = `
    select state_name as stateName from state
    where state_id = ${getDistrictIdQueryResponse.state_id};
    `
  const getStateNameQueryResponse = await database.get(getStateNameQuery)
  response.send(getStateNameQueryResponse)
})

module.exports = app
