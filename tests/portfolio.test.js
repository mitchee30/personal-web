import { describe, expect, it } from "vitest";
import { TestDriver } from "testdriverai/vitest/hooks";

describe("Personal Portfolio", () => {
  it("should navigate pages and toggle language", async (context) => {
    const testdriver = TestDriver(context);

    await testdriver.provision.chrome({ url: "https://mitchee30.github.io/personal-web/" });

    const homeAssert = await testdriver.assert("the page shows Wenbo Zhi's portfolio homepage with navigation links");
    expect(homeAssert).toBeTruthy();

    await testdriver.find("the language switch button labeled 中文").click();

    const zhAssert = await testdriver.assert("the interface text is displayed in Chinese and the language button shows EN");
    expect(zhAssert).toBeTruthy();

    await testdriver.find("the language switch button labeled EN").click();

    const enAssert = await testdriver.assert("the interface text is displayed in English and the language button shows 中文");
    expect(enAssert).toBeTruthy();

    await testdriver.find("the Projects link in the navigation bar").click();
    await testdriver.find("the Projects page heading", { timeout: 15000 });

    const projectsAssert = await testdriver.assert("the projects page is displayed with projects such as Hi Tea");
    expect(projectsAssert).toBeTruthy();

    await testdriver.find("the Say hi link in the navigation bar").click();
    await testdriver.find("the Say hi page heading", { timeout: 15000 });

    const contactAssert = await testdriver.assert("the contact page is displayed with contact options including email, GitHub, and LinkedIn");
    expect(contactAssert).toBeTruthy();
  });
});
