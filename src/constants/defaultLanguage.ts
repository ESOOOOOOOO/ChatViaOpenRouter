import { SystemLanguageDto } from "../DTOs/systemLanguage.dto";
import { languageOptions } from "./languageOptions";

export const defaultLanguage:{ name: string; language: SystemLanguageDto; avatar: string } ={ name: '', language: languageOptions[0], avatar: '' }