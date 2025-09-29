# Wildlife Management Information System for the Lake Rukwa Basin

## Introduction

This project is a component of the larger Environmental Information System (EIS) developed for the Lake Rukwa Basin in Tanzania. The Wildlife Management Information System is designed to address the significant challenges in monitoring and managing the diverse wildlife resources of the region. The system provides a structured database to store, manage, and analyze data related to wildlife populations, hunting activities, and conservation efforts.

The Lake Rukwa Basin is home to a rich variety of wildlife, including large mammals like elephants and hippos, and over 360 species of birds. However, the region faces challenges such as widespread illegal hunting, a lack of comprehensive data on wildlife populations, and limited monitoring of hunting activities. This information system aims to provide the necessary tools to support sustainable wildlife management and conservation.

## System Features

The Wildlife Management Information System is designed to support the following key features:

* **Wildlife Population Monitoring**: Track animal sightings, population estimates, and migration patterns.
* **Hunting Management**: Record and manage data on local and tourist hunters, hunting licenses, and annual quotas.
* **Anti-Poaching Support**: Analyze poaching activities in relation to game reserve boundaries and animal distribution.
* **Spatial Analysis**: Utilize GPS coordinates and GIS data to map wildlife sightings, poaching incidents, and protected areas.
* **Cross-Sectoral Integration**: Integrate with other environmental information systems, such as fisheries and beekeeping, to enable comprehensive analysis of the ecosystem.

## Database Schema

The system is built on a relational database model designed to capture the complex relationships between wildlife, hunters, and conservation areas. The key entities and their relationships are illustrated in the Entity-Relationship Diagram below.

### Entity-Relationship Diagram



### Entities and Attributes

* **WildlifeSpecies**: Stores information about each animal species.
    * `WSpeciesID` (Primary Key), `Name`, `Population`
* **Siting**: Records individual sightings of wildlife.
    * `SitingID` (Primary Key), `WSpeciesID` (Foreign Key), `Date`, `Location`
* **GameReserve**: Contains details of the protected game reserves.
    * `ReserveID` (Primary Key), `Name`, `Boundary`
* **Hunter**: A general entity for individuals who engage in hunting.
    * `HunterID` (Primary Key), `Name`, `Address`
* **LocalHunter**: A specialized entity for hunters from the local community.
    * `HunterID` (Foreign Key), `Village`
* **TouristHunter**: A specialized entity for visiting hunters.
    * `HunterID` (Foreign Key), `Country`
* **Licence**: A general entity for hunting licenses.
    * `LicenceID` (Primary Key), `HunterID` (Foreign Key), `IssueDate`, `ExpiryDate`
* **PrivateLicence**: A specialized license for private hunting.
    * `LicenceID` (Foreign Key), `PermittedSpecies`
* **SafariLicence**: A specialized license for safari-based hunting.
    * `LicenceID` (Foreign Key), `SafariCompany`

## Challenges and Future Work

The development of this system addresses several key challenges identified in the thesis:

* **Illegal Hunting**: By providing better data on legal hunting, the system can help authorities identify and target illegal activities more effectively.
* **Lack of Data**: The centralized database will serve as a repository for all wildlife-related data, ensuring that information is accessible for analysis and decision-making.
* **Limited Monitoring**: The system's data collection and analysis capabilities will enhance the monitoring of hunting and poaching activities.

Future work on this project will involve:

* **Prototype Development**: Building and testing a functional prototype of the wildlife management system.
* **Integration**: Integrating the wildlife system with the fisheries and beekeeping components to create a unified Environmental Information System for the Lake Rukwa Basin.
* **Mobile Data Collection**: Developing mobile applications to facilitate real-time data collection in the field.