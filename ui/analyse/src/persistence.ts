import { prop } from 'common';
import { objectStorage, ObjectStorage } from 'common/objectStorage';
import AnalyseCtrl from './ctrl';
import { AnalyseState } from './interfaces';

export default class Persistence {
  isDirty = false; // if isDirty show reset button to erase local move storage
  open = prop(false);
  autoOpen = true;
  moveDb?: ObjectStorage<AnalyseState>;

  constructor(readonly ctrl: AnalyseCtrl, open: boolean) {
    this.open(open);
  }

  toggleOpen() {
    this.open(!this.open());
  }

  clear = (): void => {
    this.moveDb?.remove(this.ctrl.data.game.id);
    lichess.reload();
  };

  save(): void {
    if (this.moveDb && this.isDirty) {
      this.moveDb.put(this.ctrl.data.game.id, {
        root: this.ctrl.tree.root,
        path: this.ctrl.path,
        flipped: this.ctrl.flipped,
      });
    }
  }

  onAddNode(node: Tree.Node, path: Tree.Path) {
    if (!this.isDirty) {
      this.isDirty = !this.ctrl.tree.pathExists(path + node.id);
      if (this.autoOpen) {
        this.open(true);
        this.autoOpen = false;
      }
    }
  }

  async merge(): Promise<void> {
    try {
      this.moveDb = await objectStorage<AnalyseState>('analyse-state');
      const state = await this.moveDb.get(this.ctrl.data.game.id);
      if (state) {
        this.isDirty = true;
        this.ctrl.tree.merge(state.root);
        this.ctrl.jump(state.path);
        if (state.flipped != this.ctrl.flipped) this.ctrl.flip();
      }
      this.ctrl.redraw();
    } catch (e) {
      console.log(`IDB unavailable due to security settings or quota: ${e}`);
    }
  }
}