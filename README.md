# Trailmap React (trailmap4)

This is a React/Mapbox application for displaying biking and walking trails in Massachusetts.
Tiled map services for trails and land lines are consumed from https://tiles.arcgis.com.
Landline legend and trail identification rely on Esri MapServices from https://geo.mapc.org.

## Technologies
* react
* mapbox
* sass
* axios
* bootstrap
* webpack

## Setup
1. Create a .env file in the root directory and copy and paste the .env variables in Dashlane.
2. Install local dependencies by running `npm install` .

## Run Application
`npm start`

## Deployment
1. Deployed using webpack bundling. Use the command `npm run staging`.

## Release Notes
August 11, 2023-
  * Update Responsive UI Design
  * Accessibility/ Usability update
  * Content fixes (links, test blurbs, styling consistency)
  * New Features:
    * Trail Selection Tooltip Update ( Added data labeling, multi-trail selection carousel, trail data edit link )
    * Edit Modal ( Allow the user to fill out a form to suggest data edits to selected trail data for later review )
    * Direct Data Download ( instead of linking to https://datacommon.mapc.org/ )
  * Added Multi-Layer Airtable Base Architecture for serverless secure public data entry. Implemented with two-stage bases (Intermediate and Final) because API is non-authenticated meaning that the client can intercept the client HTTP request and delete records from our base with the proper information. This is mitigated by writing to the intermediate Airtable base which is automatically synced to the Final Base which doesn't sync deletions or data manipulations.
