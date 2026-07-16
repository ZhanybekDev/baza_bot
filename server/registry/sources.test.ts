import { describe, it, expect } from 'vitest'
import { FOLDER_FILE_PROJECTS, FOLDER_FILE_SKIP, FIXED_SOURCES } from './sources.js'
import { getProject } from './projects.js'

describe('NFC normalization of Yandex file names', () => {
  it('should_match_folder_map_after_nfc_when_name_arrives_in_nfd', () => {
    // Yandex Disk отдаёт имена в NFD — буква «й» распадается на «и» + знак.
    // Файлы «знаний», «развлечений» промахивались бы без нормализации.
    for (const nfcName of ['сценарии для знаний и обучения.pdf', 'сценарии для развлечений и игр.pdf']) {
      const asNfd = nfcName.normalize('NFD')
      expect(asNfd, `${nfcName} must actually change under NFD`).not.toBe(nfcName)
      // Наш код нормализует пришедшее имя в NFC перед матчем по карте.
      expect(asNfd.normalize('NFC') in FOLDER_FILE_PROJECTS).toBe(true)
    }
  })

  it('should_store_map_keys_in_nfc', () => {
    for (const key of Object.keys(FOLDER_FILE_PROJECTS)) {
      expect(key.normalize('NFC'), `${key} must be stored in NFC`).toBe(key)
    }
  })
})

describe('source registry integrity', () => {
  it('should_reference_only_existing_projects', () => {
    const allProjectIds = [
      ...Object.values(FOLDER_FILE_PROJECTS),
      ...FIXED_SOURCES.map((s) => s.projectId),
    ].filter((id): id is string => id !== null)
    for (const id of allProjectIds) {
      expect(getProject(id), `source references unknown project ${id}`).toBeDefined()
    }
  })

  it('should_not_overlap_map_and_skip', () => {
    for (const name of Object.keys(FOLDER_FILE_SKIP)) {
      expect(name in FOLDER_FILE_PROJECTS, `${name} both mapped and skipped`).toBe(false)
    }
  })
})
