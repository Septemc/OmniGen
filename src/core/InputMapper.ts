import type { InputMapping, ExecutionInput } from "./types";

export class InputMapper {
  static map(
    input: ExecutionInput,
    mappings: InputMapping[],
    paramSchema: Array<{ key: string; apiField: string }>
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    // 处理输入映射
    for (const mapping of mappings) {
      let value: unknown;

      // 从用户输入中获取值
      if (mapping.uiField === "prompt") {
        value = input.prompt;
      } else if (mapping.uiField === "model") {
        value = input.model;
      } else if (mapping.uiField === "negativePrompt") {
        value = input.negativePrompt;
      } else if (input.params[mapping.uiField] !== undefined) {
        value = input.params[mapping.uiField];
      } else if (mapping.default !== undefined) {
        value = mapping.default;
      }

      // 枚举映射转换
      if (mapping.enumMap && value !== undefined) {
        const valueStr = String(value);
        if (mapping.enumMap[valueStr]) {
          value = mapping.enumMap[valueStr];
        }
      }

      if (value !== undefined) {
        result[mapping.apiField] = value;
      }
    }

    // 处理参数 Schema
    for (const param of paramSchema) {
      if (result[param.apiField] === undefined) {
        const value = input.params[param.key];
        if (value !== undefined) {
          result[param.apiField] = value;
        }
      }
    }

    return result;
  }
}

export default InputMapper;
