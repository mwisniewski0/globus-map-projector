// All rotations are CCW when looking at the first point of the time. E.g. 
// rotateAroundAxisNPoleToSPole, rotates CCW when looking at the North Pole.
// Coordinates of the points are always lat first, then lon

// When a vec2 is used to represent lat/lon, the .x coordinate is lon, and
// the .y coordinate is lat

// Negative longitude is West, positive is East
// Negative latitude is North, positive is South

const float PI = 3.14159265359;

// Puts the provided angle in the range between -PI to +PI
float normalizeLong(in float radians) {
	if (radians > PI) {
		float fullCyclesSurplus = floor((radians - PI) / (2.0*PI));
		return radians - (fullCyclesSurplus * 2.0 * PI);
	}
	if (radians < -PI) {
		float positiveRadians = -radians;
		float fullCyclesSurplus = floor((positiveRadians - PI) / (2.0*PI));
		return radians + (fullCyclesSurplus * 2.0 * PI);
	}
	return radians;
}

float degToRad(in float deg) {
	return deg * PI * 2.0 / 360.0;
}

float radToDeg(in float rad) {
	return rad * 360.0 / (PI * 2.0);
}

// Puts the provided angle in the range between 0 and 2PI
float normalizeAngle(in float radians) {
	if (radians < 0.0) {
		float fullCyclesSurplus = floor(-radians / (2.0*PI));
		return radians + (fullCyclesSurplus * 2.0 * PI);
	}
	if (radians > 2.0*PI) {
		float fullCyclesSurplus = floor(radians / (2.0*PI));
		return radians -  - (fullCyclesSurplus * 2.0 * PI);
	}
	return radians;
}

vec2 normalizeSphericalCoord(in vec2 latLong) {
	latLong.x = latLong.x;
	latLong.y = normalizeAngle(latLong.y);
	if (latLong.y > PI) {
		latLong.y = normalizeAngle(-latLong.y + 2.0*PI);
		latLong.x = normalizeLong(latLong.x + PI);
	}
	return latLong;
}

// Axis is expected to be from the center of the sphere to the latLongAxis point. 
// Rotating according to the right hand rule.
vec2 rotateAroundAxis(in vec2 latLong, in vec2 latLongAxis, in float angle) {
	// https://math.stackexchange.com/a/1404353

	// See spherical coordinates difference between latitude and colatitude.
	// http://mathworld.wolfram.com/SphericalCoordinates.html
	float inLat = latLong.y;
	float inLong = latLong.x;

	float axisLat = latLongAxis.y;
	float axisLong = latLongAxis.x;

	// Naming as in the mentioned stack exchange post
	// a - original point in cartesian
	// k - axis in cartesian
	// b - rotated point in cartesian
	float sinInLat = sin(inLat);
	float cosInLat = cos(inLat);
	float sinInLong = sin(inLong);
	float cosInLong = cos(inLong);
	vec3 a = vec3(sinInLong*cosInLat, sinInLat, cosInLong*cosInLat);

	float sinAxisLat = sin(axisLat);
	float cosAxisLat = cos(axisLat);
	float sinAxisLong = sin(axisLong);
	float cosAxisLong = cos(axisLong);
	vec3 k = vec3(sinAxisLong*cosAxisLat, sinAxisLat, cosAxisLong*cosAxisLat);

	float cosAngle = cos(angle);
	float sinAngle = sin(angle);
	vec3 b = cosAngle * a + sinAngle*cross(k, a) + dot(k, a)*(1.0-cosAngle)*k;

	float newLat = asin(b.y);
	float cosNewLat = cos(newLat);
	
	float sinNewLong = b.x / cosNewLat;
	float cosNewLong = b.z / cosNewLat;
	float newLong = 0.0; // placeholder
	if (abs(b.z) < 0.05) {
		// atan will become increasingly inaccurate since b.x/b.z will tend to infinity.
		// Instead, we will first rotate x and z to get a better resolution of the tangent.
		float temporaryRotation = 0.4;
		float sinTempRot = sin(temporaryRotation);
		float cosTempRot = cos(temporaryRotation);

		// rotate by the temporaryRotation
		float tempX = b.x * cosTempRot - b.z * sinTempRot;
		float tempZ = b.x * sinTempRot + b.z * cosTempRot;

		// Use the higher precision to collect the new longitude. Remember to take into
		// consideration the introduced rotation
		newLong = atan(tempX/tempZ);
		
		if (tempZ < 0.0) {
			newLong = PI + newLong;
		}
		newLong = newLong + temporaryRotation;
	} else {
		// Precision should be solid enough to simply use atan
		newLong = atan(b.x/b.z); // atan(b.y/b.x);
	
		if (b.z < 0.0) {
			newLong = PI + newLong;
		}
	}
	return normalizeSphericalCoord(vec2(newLong, newLat));
}

vec2 rotateAroundAxisNPoleToSPole(in vec2 latLong, in float radians) {
    float lon = latLong.x + radians;
	return vec2(normalizeLong(lon), latLong.y);
}

vec2 rotateAroundAxis0_0to0_180(in vec2 latLong, in float radians) {
	return rotateAroundAxis(latLong, vec2(0.0, 0.0), radians);
}

vec2 rotateAroundAxis0_90to0_270(in vec2 latLong, in float radians) {
	return rotateAroundAxis(latLong, vec2(0.0, PI/2.0), radians);
}

vec2 transverse(in vec2 latLong) {
	return rotateAroundAxis(latLong, vec2(PI, 0.0), PI/2.0);
}

vec2 latLongToTexelCoord(in vec2 latLong) {
	// longitude is between -PI to PI. By adding PI, we turn it to between
	// 0 and 2PI. Dividing by 2PI makes it between 0 and 1.
	float x = (latLong.x + PI) / (2.0*PI);
	
	// latitude is between -PI/2 to PI/2. By adding PI/2, we turn it to
	// between 0 and PI. Dividing by PI makes it between 0 and 1.
	float y = (latLong.y + PI*0.5) / PI;
	
	return vec2(x, y);
}

vec2 texelCoordToLatLong(in vec2 texelCoord) {
	return vec2(texelCoord.x * 2.0 * PI - PI, texelCoord.y * PI - PI*0.5);
}
