import { describe, it, expect } from "vitest";
import { generatePixPayload, generateQrMatrix, generateQrPath, crc16 } from "../src/services/pix";

describe("Pix BR Code e QR Code", () => {
  it("calcula o CRC16 correto conforme norma Bacen", () => {
    // Exemplo padrão
    const testData = "00020126330014br.gov.bcb.pix011112345678900520400005303986540549.905802BR5910TESTE NOME6009SAO PAULO62070503***6304";
    const crc = crc16(testData);
    expect(crc).toBe("9D59");
  });

  it("gera payload Pix com todos os campos obrigatórios e valor formatado", () => {
    const payload = generatePixPayload({
      key: "getuliopedromoreirafilho@gmail.com",
      name: "Getúlio Pedro Moreira Filho",
      city: "São Paulo",
      amount: 49.9,
    });

    expect(payload).toContain("000201");
    expect(payload).toContain("0014br.gov.bcb.pix");
    expect(payload).toContain("getuliopedromoreirafilho@gmail.com");
    expect(payload).toContain("540549.90");
    expect(payload).toContain("5802BR");
    expect(payload).toContain("6009SAO PAULO");
    expect(payload).toContain("6304");
  });

  it("gera matriz de QR Code e caminho SVG sem erros", () => {
    const payload = generatePixPayload({
      key: "teste@example.com",
      name: "Teste",
      amount: 10,
    });
    const matrix = generateQrMatrix(payload);
    expect(matrix.length).toBeGreaterThanOrEqual(21);
    expect(matrix[0].length).toBe(matrix.length);

    const { path, viewBox } = generateQrPath(matrix);
    expect(path).toContain("M");
    expect(viewBox).toMatch(/0 0 \d+ \d+/);
  });
});

