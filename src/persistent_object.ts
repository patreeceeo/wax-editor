import { produce, type Producer } from "structurajs";

export class PersistentObject {
  produce(updater: Producer<this, this, false>): this {
    const result = produce<this, this>(this, updater) as this;
    result.afterProduce();
    return result;
  }
  afterProduce(): void {}
}
