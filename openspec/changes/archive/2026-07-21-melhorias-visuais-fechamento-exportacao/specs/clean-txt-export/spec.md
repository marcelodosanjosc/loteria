## ADDED Requirements

### Requirement: Clean TXT Export Format
The system SHALL export lottery game tickets as plain text files containing ONLY two-digit zero-padded numbers separated by spaces, with one ticket per line.

#### Scenario: Exporting tickets to TXT file
- **WHEN** user clicks the "Exportar TXT" button on generated games
- **THEN** system downloads a `.txt` file where each line contains space-separated numbers without commas, prefixes, or headers

### Requirement: Clipboard Copying of Clean Tickets
The system SHALL support copying all generated tickets or individual tickets to the clipboard formatted with space-separated numbers.

#### Scenario: Copying all tickets to clipboard
- **WHEN** user clicks the "Copiar Apostas" button
- **THEN** all tickets are copied to clipboard as space-separated lines and a success Toast notification is displayed
