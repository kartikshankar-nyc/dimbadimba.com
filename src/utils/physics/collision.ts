interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Circle {
  x: number;
  y: number;
  radius: number;
}

export function checkCollision(obj1: Rectangle | Circle, obj2: Rectangle | Circle): boolean {
  if (isRectangle(obj1) && isRectangle(obj2)) {
    return checkRectangleCollision(obj1, obj2);
  } else if (isCircle(obj1) && isCircle(obj2)) {
    return checkCircleCollision(obj1, obj2);
  } else if (isRectangle(obj1) && isCircle(obj2)) {
    return checkRectangleCircleCollision(obj1, obj2);
  } else if (isCircle(obj1) && isRectangle(obj2)) {
    return checkRectangleCircleCollision(obj2, obj1);
  }
  return false;
}

function isRectangle(obj: Rectangle | Circle): obj is Rectangle {
  return 'width' in obj && 'height' in obj;
}

function isCircle(obj: Rectangle | Circle): obj is Circle {
  return 'radius' in obj;
}

function checkRectangleCollision(rect1: Rectangle, rect2: Rectangle): boolean {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

function checkCircleCollision(circle1: Circle, circle2: Circle): boolean {
  const dx = circle1.x - circle2.x;
  const dy = circle1.y - circle2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < circle1.radius + circle2.radius;
}

function checkRectangleCircleCollision(rect: Rectangle, circle: Circle): boolean {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
  
  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;
  
  return (distanceX * distanceX + distanceY * distanceY) < (circle.radius * circle.radius);
} 