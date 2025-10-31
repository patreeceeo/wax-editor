import {produce, type Producer} from 'structurajs';

export class PersistentObject {
  produce(updater: Producer<this, void, false>): this {
    const result = produce(this, updater) as this;
    result.afterProduce();
    return result;
  }
  afterProduce(): void {
  }
}

