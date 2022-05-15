import downsize from './main.mjs';
import { expect } from 'chai';

describe("Word-wise truncation with esm", function () {
  it("should be able to truncate across nested tags", function () {
    expect(downsize("<p>this is a <strong>test of word downsizing</strong></p>", {words: 5}))
      .to.equal("<p>this is a <strong>test of</strong></p>");
  });
});
