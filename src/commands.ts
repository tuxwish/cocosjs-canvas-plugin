export const initializingFunctionsCommand = `
  if (!window.__myCustomCodeLoaded__) {
    window.__myCustomCodeLoaded__ = true;

    window.AbstractNode = class {
      constructor(node, screenWidth, screenHeight) {
        this.node = node;
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
      }

      getParent() {
        return null;
      }

      getChildren() {
        // :rettype: Iterable<AbstractNode>
      }

      getAttr(attrName) {
        const attrs = {
          id: '',
          name: '<Root>',
          fullPath: '',
          type: 'Root',
          visible: true,
          position: [0.0, 0.0, 0.0],
          world_position: [0.0, 0.0],
          size: [0.0, 0.0],
          world_size: [0.0, 0.0],
          scale: [1.0, 1.0],
          anchorPoint: [0.5, 0.5],
          zOrders: { local: 0, global: 0 },
          opacity: 0,
          sprite: '',
          animation: {},
          widget: {},
        };

        return attrs[attrName];
      }

      setAttr(attrName, _val) {
        throw new Error('Unable to set attributes ' + attrName + ' on this node. (NotImplemented) ');
      }

      getAvailableAttributeNames() {
        // enumerate all available attributes' name of this node
        // :rettype: Iterable<string>

        return [
          'id',
          'name',
          'fullPath',
          'type',
          'visible',
          'position',
          'size',
          'scale',
          'anchorPoint',
          'zOrders',
          'opacity',
          'sprite',
          'animation',
          'world_position',
          'world_size',
          'widget',
        ];
      }

      enumerateAttrs() {
        // :rettype: Iterable<string, ValueType>
        const ret = {};
        const allAttrNames = this.getAvailableAttributeNames();
        for (const i in allAttrNames) {
          const attrName = allAttrNames[i];
          const attrVal = this.getAttr(attrName);
          if (attrVal !== undefined) {
            ret[attrName] = attrVal;
          }
        }
        return ret;
      }
    }

    window.cgetter = (node, property) => {
      if (!node) {
        console.log('no node for property', property);
        return;
      }
      const getterFunc = 'get' + property[0].toUpperCase() + property.slice(1);
      if (node[getterFunc]) {
        return node[getterFunc].call(node);
      } else if (node[property]) {
        return node[property];
      } else {
        return node['_' + property];
      }
    };

    window.CocosNode = class extends AbstractNode {
      constructor(node, screenWidth, screenHeight) {
        super(node, screenWidth, screenHeight);
        this.node = node;
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
      }

      getParent() {
        const parent = cgetter(this.node, 'parent');
        if (!parent) {
          return null;
        }
        return new CocosNode(parent, this.screenWidth, this.screenHeight);
      }

      getChildren() {
        let children = null;
        const nodeChildren = cgetter(this.node, 'children');
        if (nodeChildren) {
          children = [];
          for (const i in nodeChildren) {
            const child = nodeChildren[i];
            children.push(new CocosNode(child, this.screenWidth, this.screenHeight));
          }
        }
        return children;
      }

      setAttr(_attrName, _val) {
        // raise UnableToSetAttributeException(attrName, self.node)
      }

      getAvailableAttributeNames() {
        // enumerate all available attributes' name of this node
        // :rettype: Iterable<string>

        return AbstractNode.prototype.getAvailableAttributeNames.call(this).concat(['text', 'touchable', 'enabled', 'tag', 'rotation']);
      }

      getAttr(attrName) {
        try {
          if (attrName === 'visible') {
            if (typeof this.node.active !== 'undefined') {
              return this.node.active;
            } else {
              return this.node._activeInHierarchy;
            }
          } else if (attrName === 'id') {
            return this.node._id;
          } else if (attrName === 'fullPath' && this.node.getPathInHierarchy) {
            return this.node.getPathInHierarchy();
          } else if (attrName === 'name') {
            return cgetter(this.node, 'name') || '<no-name>';
          } else if (attrName === 'text') {
            for (const i in this.node._components) {
              const c = this.node._components[i];
              if (c && c.string !== undefined) {
                return c.string;
              } else {
                return '';
              }
            }

            return cgetter(this.node, 'string');
          } else if (attrName === 'type') {
            let ntype = '';
            if (this.node._components) {
              for (let i = this.node._components.length - 1; i >= 0; i--) {
                ntype = this.node._components[i].__classname__;
                if (ntype.startsWith('cc')) {
                  break;
                }
              }
            }
            if (!ntype) {
              ntype = this.node.__classname__ || this.node._className;
            }
            if (!ntype) {
              if (this.node.constructor) {
                ntype = this.node.constructor.name;
              }
            }
            if (!ntype) {
              ntype = 'Object';
            }
            return ntype.replace(/\w+\./, '');
          } else if (attrName === 'position') {
            const pos = this.node.getPosition();
            return [pos.x, pos.y, pos.z];
          } else if (attrName === 'world_position') {
            const pos = this.node.getWorldPosition();
            return [pos.x, pos.y];
          } else if (attrName === 'size') {
            if (this.node.getComponent('cc.UITransform')) {
              const size = new cc.Size(this.node.getComponent('cc.UITransform').width, this.node.getComponent('cc.UITransform').height);
              // size.width /= this.screenWidth;
              // size.height /= this.screenHeight;
              return [size.width, size.height];
            }
            return [0, 0];
          } else if (attrName === 'world_size') {
            if (this.node.getComponent('cc.UITransform')) {
              const size = new cc.Size(this.node.getComponent('cc.UITransform').width, this.node.getComponent('cc.UITransform').height);
              return [size.width, size.height];
            }
            return [0, 0];
          } else if (attrName === 'scale') {
            const scale = this.node.scale;
            return [scale.x, scale.y, scale.z];
          } else if (attrName === 'anchorPoint') {
            if (this.node.getComponent('cc.UITransform')) {
              return [this.node.getComponent('cc.UITransform').anchorX, this.node.getComponent('cc.UITransform').anchorY];
            }
            return [];
          } else if (attrName === 'zOrders') {
            return {
              local: this.node.getSiblingIndex() || 0,
              global: this.node.getSiblingIndex() || 0,
            };
          } else if (attrName == 'touchable') {
            if (this.node.isTouchEnabled) {
              return this.node.isTouchEnabled();
            }
          } else if (attrName === 'tag') {
            return cgetter(this.node, 'tag');
          } else if (attrName === 'enabled') {
            if (this.node.isEnabled) {
              return this.node.isEnabled();
            }
          } else if (attrName === 'rotation') {
            return cgetter(this.node, 'rotation');
          } else if (attrName === 'opacity') {
            if (this.node.getComponent('cc.UIOpacity')) {
              return this.node.getComponent('cc.UIOpacity').opacity;
            }
            return 0;
          } else if (attrName === 'sprite') {
            if (this.node.getComponent('cc.Sprite') && this.node.getComponent('cc.Sprite').spriteFrame?.name) {
              return this.node.getComponent('cc.Sprite').spriteFrame.name;
            }
            return '';
          } else if (attrName === 'animation') {
            if (this.node.getComponent('cc.Animation')) {
              let defaultClip = {};
              if (this.node.getComponent('cc.Animation').defaultClip) {
                defaultClip = {
                  name: this.node.getComponent('cc.Animation').defaultClip.name,
                  played: this.node.getComponent('cc.Animation').defaultClip._hasBeenPlayed,
                };
              }
              const animationClips = this.node.getComponent('cc.Animation').clips.filter((animationClip) => !!animationClip);
              return {
                defaultClip,
                clips:
                  animationClips.map((animationClip) => {
                    return {
                      name: animationClip.name,
                      played: false,
                    };
                  }) || [],
              };
            }
            return {};
          } else if (attrName === 'widget') {
            if (this.node.getComponent('cc.Widget')) {
              const nodeWidget = this.node.getComponent('cc.Widget');
              return {
                isAbsoluteBottom: nodeWidget.isAbsoluteBottom,
                isAbsoluteLeft: nodeWidget.isAbsoluteLeft,
                isAbsoluteRight: nodeWidget.isAbsoluteRight,
                isAbsoluteTop: nodeWidget.isAbsoluteTop,
                isAlignBottom: nodeWidget.isAlignBottom,
                isAlignLeft: nodeWidget.isAlignLeft,
                isAlignRight: nodeWidget.isAlignRight,
                isAlignTop: nodeWidget.isAlignTop,
                top: nodeWidget.top,
                left: nodeWidget.left,
                right: nodeWidget.right,
                bottom: nodeWidget.bottom,
              };
            }
            return {};
          }
        } catch (error) {
          console.log('error getting attr:', error);
          throw error;
        }

        return undefined;
      }
    }

    window.getRoot = () => {
      const winSize = cc.view.getVisibleSize();
      const scene = cc.director.getScene();
      return new CocosNode(scene, winSize.width, winSize.height);
    }

    window.dumpHierarchyImpl = (node, onlyVisibleNode) => {
      if (!node) {
        return null;
      }
      if (onlyVisibleNode === undefined) {
        onlyVisibleNode = true;
      }

      const payload = node.enumerateAttrs();
      const result = {};
      const children = [];
      const nodeChildren = node.getChildren();
      for (const i in nodeChildren) {
        const child = nodeChildren[i];
        if (child.node && (!onlyVisibleNode || payload['visible'] || child.getAttr('visible'))) {
          children.push(dumpHierarchyImpl(child, onlyVisibleNode));
        }
      }
      if (children.length > 0) {
        result['children'] = children;
      }

      result['name'] = (payload && payload['name']) || node.getAttr('name');
      result['payload'] = payload;

      return result;
    }

    window.dumpHierarchy = () => {
      try {
        return dumpHierarchyImpl(getRoot());
      } catch (error) {
        console.log('dumpHierarchy error', error);
        return null;
      }
    }

    window.calculateNodePosition = (selectedNode, isTopParentNode, topNodePosition) => {
      const nodePosition = !isTopParentNode && topNodePosition ? topNodePosition : selectedNode.getPosition();
      const localScale = selectedNode.scale;
      if (localScale.x) {
        nodePosition.x *= localScale.x;
      }
      if (localScale.y) {
        nodePosition.y *= localScale.y;
      }
      if (localScale.z) {
        nodePosition.z *= localScale.z;
      }

      if (!isTopParentNode) {
        return nodePosition;
      }

      const nodeAnchorPoint = selectedNode.getComponent('cc.UITransform').anchorPoint;
      const nodeWidth = selectedNode.getComponent('cc.UITransform').width;
      const nodeHeight = selectedNode.getComponent('cc.UITransform').height;
      if (nodeAnchorPoint.y === 0) {
      } else if (nodeAnchorPoint.y === 1) {
        nodePosition.y -= nodeHeight / 2;
      }

      return nodePosition;
    }

    window.getNodePosition = (selectedNode, nodeFullPath) => {
      const parsedPath = nodeFullPath.split('/');

      let pathIndex = 1;
      let nodePathToCalculate = parsedPath[0] + '/' + parsedPath[1];
      let isTopParentNode = nodePathToCalculate === nodeFullPath;
      const nodePositionToCalculate = cc.find(nodePathToCalculate);
      let nodePosition = window.calculateNodePosition(nodePositionToCalculate, isTopParentNode);
      while (pathIndex < parsedPath.length - 1) {
        isTopParentNode = nodePathToCalculate === nodeFullPath;
        const nodePositionToCalculate = cc.find(nodePathToCalculate);
        nodePosition = window.calculateNodePosition(nodePositionToCalculate, isTopParentNode, nodePosition);
        pathIndex++;
        nodePathToCalculate += '/' + parsedPath[pathIndex];
      }

      if (isTopParentNode) {
        return nodePosition;
      }

      const nodeAnchorPoint = selectedNode.getComponent('cc.UITransform').anchorPoint;
      const nodeWidth = selectedNode.getComponent('cc.UITransform').width;
      const nodeHeight = selectedNode.getComponent('cc.UITransform').height;
      const localScale = selectedNode.scale;
      if (nodeAnchorPoint.x === 0) {
        nodePosition.x += nodeWidth / 2 * localScale.x;
      } else if (nodeAnchorPoint.x === 1) {
        nodePosition.x -= nodeWidth / 2 * localScale.x;
      }
      if (nodeAnchorPoint.y === 1) {
        nodePosition.y -= nodeHeight / 2 * localScale.y;
      }

      nodePosition.x += selectedNode.position.x;
      nodePosition.y += selectedNode.position.y;
      return nodePosition;
    }

    window.showRedBorderOver = (selectedNode, nodeFullPath) => {
      const canvas = cc.director.getScene().getChildByName('Canvas');
      if (!canvas || !selectedNode) return;

      // Create a new node
      const borderNode = new cc.Node('RedBorder');
      const border = borderNode.addComponent('cc.UITransform'); // for Cocos Creator 3.x
      const graphics = borderNode.addComponent('cc.Graphics'); // Used to draw shapes

      // Set anchor and position to match the selected node
      // if (selectedNode.getPosition().x === 0 && selectedNode.getPosition().y === 0) {
      //   borderNode.setWorldPosition(selectedNode.getWorldPosition());
      // } else {
        // borderNode.getComponent('cc.UITransform').setAnchorPoint(selectedNode.getComponent('cc.UITransform').anchorPoint);
        // const nodePosition = window.getNodePosition(selectedNode, nodeFullPath);
        // borderNode.setPosition(nodePosition);
      // }

      // Add to canvas
      canvas.addChild(borderNode);

      // Draw red rectangle
      graphics.lineWidth = 10 / selectedNode.getScale().x;
      graphics.strokeColor = cc.Color.RED;
      const size = selectedNode.getComponent('cc.UITransform').contentSize;
      graphics.rect(-size.width / 2, -size.height / 2, size.width, size.height);
      graphics.stroke();

      borderNode.getComponent('cc.UITransform').setAnchorPoint(selectedNode.getComponent('cc.UITransform').anchorPoint);
      borderNode.getComponent('cc.UITransform').setContentSize(selectedNode.getComponent('cc.UITransform').contentSize);
      const worldPosition = selectedNode.getWorldPosition();
      borderNode.setWorldPosition(worldPosition);

      borderNode.setScale(selectedNode.getScale());
      borderNode.angle = selectedNode.angle;
    }

    window.delay = (ms) => {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }
`;

export const runDumpCommand = `dumpHierarchy();`;
